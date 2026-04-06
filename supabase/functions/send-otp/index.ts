import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone: rawPhone } = await req.json();
    const phone = rawPhone?.replace(/[\s+]/g, "");
    if (!phone) {
      return new Response(JSON.stringify({ error: "Phone number is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString(); // 3 min

    // Store OTP
    const { error: dbError } = await supabase.from("otp_codes").insert({
      phone,
      code,
      expires_at: expiresAt,
    });

    if (dbError) throw dbError;

    // Send via WasenderAPI (non-blocking - OTP is already stored)
    const WASENDER_API_KEY = Deno.env.get("WASENDER_API_KEY");
    if (WASENDER_API_KEY) {
      try {
        const wasenderRes = await fetch("https://www.wasenderapi.com/api/send-message", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${WASENDER_API_KEY}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            to: phone.startsWith("967") ? phone : phone.replace(/^0/, "967"),
            text: `🔐 رمز التحقق الخاص بك هو: *${code}*\n\n⏱ ينتهي الرمز خلال 3 دقائق\n⚠️ لا تشارك هذا الرمز مع أحد\n\nDebtFlow - ديبت فلو`,
          }),
        });

        if (!wasenderRes.ok) {
          const errBody = await wasenderRes.text();
          console.error("WasenderAPI error:", errBody);
        }
      } catch (wasenderErr) {
        console.error("WasenderAPI connection error:", wasenderErr);
        // Continue - OTP is stored, user can still verify
      }
    } else {
      console.warn("WASENDER_API_KEY not configured - OTP stored but not sent");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
