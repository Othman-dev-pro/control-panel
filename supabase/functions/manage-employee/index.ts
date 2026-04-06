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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: claimsErr } = await supabaseAuth.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ownerId = claims.claims.sub;

    // Verify owner role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleCheck } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", ownerId)
      .eq("role", "owner")
      .maybeSingle();

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Only owners can manage employees" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const { name, username, password } = body;
      if (!name || !username || !password) {
        return new Response(JSON.stringify({ error: "name, username, password required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create auth user with email = username@employee.local
      const fakeEmail = `${username}@employee.debtflow.local`;
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: fakeEmail,
        password,
        email_confirm: true,
        user_metadata: { name, username },
      });

      if (createErr) {
        if (createErr.message?.includes("already been registered") || createErr.code === "email_exists") {
          return new Response(JSON.stringify({ error: "اسم المستخدم مسجل مسبقاً، اختر اسم مستخدم آخر" }), {
            status: 422,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw createErr;
      }

      // Update profile
      await supabaseAdmin.from("profiles").update({
        name,
        username,
        owner_id: ownerId,
      }).eq("user_id", newUser.user.id);

      // Assign employee role
      await supabaseAdmin.from("user_roles").insert({
        user_id: newUser.user.id,
        role: "employee",
      });

      return new Response(JSON.stringify({ success: true, userId: newUser.user.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      const { employeeId, name, username, password } = body;
      if (!employeeId) {
        return new Response(JSON.stringify({ error: "employeeId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify employee belongs to owner
      const { data: empProfile } = await supabaseAdmin
        .from("profiles")
        .select("owner_id, user_id")
        .eq("user_id", employeeId)
        .maybeSingle();

      if (!empProfile || empProfile.owner_id !== ownerId) {
        return new Response(JSON.stringify({ error: "Employee not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update profile
      const updates: Record<string, string> = {};
      if (name) updates.name = name;
      if (username) updates.username = username;

      if (Object.keys(updates).length > 0) {
        await supabaseAdmin.from("profiles").update(updates).eq("user_id", employeeId);
      }

      // Update auth user
      const authUpdates: Record<string, unknown> = {};
      if (username) authUpdates.email = `${username}@employee.debtflow.local`;
      if (password) authUpdates.password = password;

      if (Object.keys(authUpdates).length > 0) {
        await supabaseAdmin.auth.admin.updateUserById(employeeId, authUpdates);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { employeeId } = body;
      if (!employeeId) {
        return new Response(JSON.stringify({ error: "employeeId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify employee belongs to owner
      const { data: empProfile } = await supabaseAdmin
        .from("profiles")
        .select("owner_id")
        .eq("user_id", employeeId)
        .maybeSingle();

      if (!empProfile || empProfile.owner_id !== ownerId) {
        return new Response(JSON.stringify({ error: "Employee not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete auth user (cascades to profiles, user_roles)
      await supabaseAdmin.auth.admin.deleteUser(employeeId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
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
