import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { order_id, action, rejection_reason } = await req.json();
    if (!order_id || !action) throw new Error("Missing params");

    // Get order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();
    if (orderErr || !order) throw new Error("Order not found");
    if (order.status !== "pending") throw new Error("Order already processed");

    let appliedPaymentAmount = 0;
    let returnedPaymentAmount = 0;

    if (action === "approve") {
      if (order.type === "debt_request") {
        // Check debt limit before approving
        const { data: customer } = await serviceClient
          .from("customers")
          .select("debt_limit, name")
          .eq("id", order.customer_id)
          .single();

        if (customer?.debt_limit != null) {
          // Calculate current balance
          const { data: existingDebts } = await serviceClient
            .from("debts")
            .select("amount")
            .eq("customer_id", order.customer_id)
            .eq("owner_id", order.owner_id);
          const { data: existingPayments } = await serviceClient
            .from("payments")
            .select("amount")
            .eq("customer_id", order.customer_id)
            .eq("owner_id", order.owner_id);

          const totalDebts = (existingDebts || []).reduce((s: number, d: any) => s + Number(d.amount), 0);
          const totalPayments = (existingPayments || []).reduce((s: number, p: any) => s + Number(p.amount), 0);
          const currentBalance = totalDebts - totalPayments;

          if (currentBalance + Number(order.amount) > customer.debt_limit) {
            // Auto-reject with reason
            await supabase.from("orders").update({
              status: "rejected",
              rejection_reason: `المبلغ يتجاوز سقف الدين. السقف: ${customer.debt_limit}، الرصيد الحالي: ${currentBalance}، المطلوب: ${order.amount}`,
              processed_at: new Date().toISOString(),
              processed_by: user.id,
            }).eq("id", order_id);

            // Notify customer
            const { data: custData } = await serviceClient
              .from("customers")
              .select("user_id")
              .eq("id", order.customer_id)
              .single();
            if (custData?.user_id) {
              await serviceClient.from("notifications").insert({
                user_id: custData.user_id,
                title: "تم رفض طلب الدين",
                message: `تم رفض طلب الدين بمبلغ ${order.amount} ر.ي لأنه يتجاوز سقف الدين المحدد (${customer.debt_limit} ر.ي)`,
                type: "order",
                related_id: order_id,
              });
            }

            // Notify owner
            await serviceClient.from("notifications").insert({
              user_id: order.owner_id,
              title: "تم رفض طلب دين تلقائياً",
              message: `تم رفض طلب ${customer.name || "زبون"} بمبلغ ${order.amount} ر.ي تلقائياً لتجاوز سقف الدين (${customer.debt_limit} ر.ي)`,
              type: "order",
              related_id: order_id,
            });

            return new Response(JSON.stringify({ 
              success: false, 
              error: "DEBT_LIMIT_EXCEEDED",
              message: `المبلغ يتجاوز سقف الدين. السقف: ${customer.debt_limit}، الرصيد الحالي: ${currentBalance}` 
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }

        // Create debt
        const { error: debtErr } = await supabase.from("debts").insert({
          customer_id: order.customer_id,
          owner_id: order.owner_id,
          amount: order.amount,
          description: order.description,
          image_url: order.image_url,
          created_by: user.id,
        });
        if (debtErr) throw new Error("Failed to create debt: " + debtErr.message);
      } else if (order.type === "payment_request") {
        // Find the customer's debts to apply payment
        const { data: debts } = await supabase
          .from("debts")
          .select("id, amount")
          .eq("customer_id", order.customer_id)
          .eq("owner_id", order.owner_id)
          .order("created_at", { ascending: true });

        const { data: existingPayments } = await supabase
          .from("payments")
          .select("debt_id, amount")
          .eq("customer_id", order.customer_id)
          .eq("owner_id", order.owner_id);

        // Calculate remaining per debt
        const paidMap: Record<string, number> = {};
        (existingPayments || []).forEach((p: any) => {
          paidMap[p.debt_id] = (paidMap[p.debt_id] || 0) + Number(p.amount);
        });

        let remaining = Number(order.amount);
        for (const debt of debts || []) {
          if (remaining <= 0) break;
          const paid = paidMap[debt.id] || 0;
          const debtRemaining = Number(debt.amount) - paid;
          if (debtRemaining <= 0) continue;
          const payAmount = Math.min(remaining, debtRemaining);
          
          const desc = order.payment_method_provider 
            ? `${order.payment_method_provider} - ${order.transaction_number || ""}`
            : order.description;

          const { error: payErr } = await supabase.from("payments").insert({
            customer_id: order.customer_id,
            owner_id: order.owner_id,
            debt_id: debt.id,
            amount: payAmount,
            description: desc,
            created_by: user.id,
          });
          if (payErr) throw new Error("Failed to create payment: " + payErr.message);
          appliedPaymentAmount += payAmount;
          remaining -= payAmount;
        }

        if (appliedPaymentAmount <= 0) {
          throw new Error("NO_OUTSTANDING_DEBTS");
        }

        returnedPaymentAmount = Math.max(0, Number(order.amount) - appliedPaymentAmount);
      }

      // Update order status
      await supabase.from("orders").update({
        status: "approved",
        processed_at: new Date().toISOString(),
        processed_by: user.id,
      }).eq("id", order_id);

      // Get customer user_id for notification
      const { data: customer } = await serviceClient
        .from("customers")
        .select("user_id, name")
        .eq("id", order.customer_id)
        .single();

      // Notify customer
      if (customer?.user_id) {
        const msg = order.type === "debt_request"
          ? `تم قبول طلبك وتسجيل مبلغ ${order.amount} ر.ي عليك`
          : returnedPaymentAmount > 0
            ? `تم قبول طلب السداد، وتم تسجيل ${appliedPaymentAmount} ر.ي فقط لأن المتبقي أقل من المبلغ المطلوب. سيتم إرجاع ${returnedPaymentAmount} ر.ي لك`
            : `تم قبول طلب السداد بمبلغ ${appliedPaymentAmount || order.amount} ر.ي`;
        await serviceClient.from("notifications").insert({
          user_id: customer.user_id,
          title: order.type === "debt_request" ? "تم قبول طلب الدين" : "تم قبول طلب السداد",
          message: msg,
          type: "order",
          related_id: order_id,
        });
      }

      // Notify owner
      const customerName = customer?.name || "زبون";
      await serviceClient.from("notifications").insert({
        user_id: order.owner_id,
        title: order.type === "debt_request" ? "تم تسجيل دين" : "تم تسجيل سداد",
        message: order.type === "debt_request"
          ? `تم تسجيل مبلغ ${order.amount} ر.ي على ${customerName}`
          : returnedPaymentAmount > 0
            ? `تم تسجيل سداد بمبلغ ${appliedPaymentAmount} ر.ي من ${customerName}، وسيتم إرجاع ${returnedPaymentAmount} ر.ي كزيادة`
            : `تم تسجيل سداد بمبلغ ${appliedPaymentAmount || order.amount} ر.ي من ${customerName}`,
        type: "order",
        related_id: order_id,
      });

    } else if (action === "reject") {
      await supabase.from("orders").update({
        status: "rejected",
        rejection_reason: rejection_reason || "",
        processed_at: new Date().toISOString(),
        processed_by: user.id,
      }).eq("id", order_id);

      // Notify customer
      const { data: customer } = await serviceClient
        .from("customers")
        .select("user_id")
        .eq("id", order.customer_id)
        .single();

      if (customer?.user_id) {
        const msg = order.type === "debt_request"
          ? `تم رفض طلب الدين بمبلغ ${order.amount} ر.ي. السبب: ${rejection_reason || "-"}`
          : `تم رفض طلب السداد بمبلغ ${order.amount} ر.ي. السبب: ${rejection_reason || "-"}`;
        await serviceClient.from("notifications").insert({
          user_id: customer.user_id,
          title: order.type === "debt_request" ? "تم رفض طلب الدين" : "تم رفض طلب السداد",
          message: msg,
          type: "order",
          related_id: order_id,
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("process-order error:", err.message, err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
