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
    const { phone, password, name, role, business_name, business_address } = await req.json();
    if (!phone || !password || !name) {
      return new Response(JSON.stringify({ error: "phone, password, name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if phone verified
    const { data: otpRecord } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("phone", phone)
      .eq("verified", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRecord) {
      return new Response(JSON.stringify({ error: "Phone not verified" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userRole = role === "owner" ? "owner" : "customer";
    const fakeEmail = `${phone.replace(/\+/g, "")}@phone.debtflow.local`;

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === fakeEmail);

    if (existingUser) {
      // User exists - check if they already have this role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", existingUser.id)
        .eq("role", userRole)
        .maybeSingle();

      if (existingRole) {
        return new Response(JSON.stringify({ error: "User already has this role" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Add new role to existing user
      await supabase.from("user_roles").insert({
        user_id: existingUser.id,
        role: userRole,
      });

      // If adding owner role, update profile with subscription info
      if (userRole === "owner") {
        // Get configurable trial duration
        const { data: trialSetting } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "trial_duration_days")
          .maybeSingle();
        const trialDays = parseInt(trialSetting?.value || "30");
        
        const profileUpdate: Record<string, unknown> = {};
        profileUpdate.subscription_status = "trial";
        profileUpdate.trial_ends_at = new Date(Date.now() + trialDays * 86400000).toISOString();
        profileUpdate.is_subscription_active = true;
        if (business_name) profileUpdate.business_name = business_name;
        await supabase.from("profiles").update(profileUpdate).eq("user_id", existingUser.id);
      }

      // If adding customer role, link any existing customer records
      if (userRole === "customer") {
        await supabase
          .from("customers")
          .update({ user_id: existingUser.id })
          .is("user_id", null)
          .or(`phone.eq.${phone},phone.eq.${phone.replace(/^\+/, "")}`);
      }

      // Clean up used OTP
      await supabase.from("otp_codes").delete().eq("phone", phone).eq("verified", true);

      return new Response(JSON.stringify({
        success: true,
        roleAdded: true,
        userId: existingUser.id,
        email: fakeEmail
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create new auth user
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email: fakeEmail,
      phone,
      password,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: { name },
    });

    if (createErr) {
      throw createErr;
    }

    // Update profile with additional data
    const profileUpdate: Record<string, unknown> = { name, phone };
    if (userRole === "owner") {
      // Get configurable trial duration
      const { data: trialSetting } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "trial_duration_days")
        .maybeSingle();
      const trialDays = parseInt(trialSetting?.value || "30");
      
      profileUpdate.subscription_status = "trial";
      profileUpdate.trial_ends_at = new Date(Date.now() + trialDays * 86400000).toISOString();
      profileUpdate.is_subscription_active = true;
      if (business_name) profileUpdate.business_name = business_name;
    }

    await supabase.from("profiles").update(profileUpdate).eq("user_id", newUser.user.id);

    // Assign role
    await supabase.from("user_roles").insert({
      user_id: newUser.user.id,
      role: userRole,
    });

    // If customer, link any existing customer records with matching phone
    if (userRole === "customer") {
      await supabase
        .from("customers")
        .update({ user_id: newUser.user.id })
        .is("user_id", null)
        .or(`phone.eq.${phone},phone.eq.${phone.replace(/^\+/, "")}`);
    }

    // Clean up used OTP
    await supabase.from("otp_codes").delete().eq("phone", phone).eq("verified", true);

    return new Response(JSON.stringify({ 
      success: true, 
      userId: newUser.user.id,
      email: fakeEmail
    }), {
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
