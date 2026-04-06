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
    const { phone, password } = await req.json();
    if (!phone || !password) {
      return new Response(JSON.stringify({ error: "Phone and password are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. تحقق من أن رمز OTP تم توثيقه لهذا الرقم في آخر 10 دقائق
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: otpRecord } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("phone", phone)
      .eq("verified", true)
      .gte("created_at", tenMinAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRecord) {
      return new Response(JSON.stringify({ error: "OTP not verified" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. البحث عن معرف المستخدم (user_id) مباشرة وبدون قيود الـ 50 مستخدم
    let targetUserId = null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('phone', phone)
      .maybeSingle();

    if (profile) {
      targetUserId = profile.user_id;
    } else {
      // كإجراء احتياطي إذا لم يتم العثور على البروفايل، نقوم بالبحث عبر الإيميل الوهمي.
      // نصلح الإيميل بحذف 967 إن وجدت ليتطابق مع عملية تسجيل الدخول.
      let localPhone = phone.replace(/\+/g, "");
      if (localPhone.startsWith("967")) {
          localPhone = localPhone.substring(3);
      }
      const fakeEmail = `${localPhone}@phone.debtflow.local`;
      
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const user = usersData?.users?.find(u => u.email === fakeEmail);
      if (user) targetUserId = user.id;
    }

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. تحديث كلمة المرور للمستخدم الفعلي
    const { error: updateError } = await supabase.auth.admin.updateUserById(targetUserId, {
      password,
    });

    if (updateError) throw updateError;

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
