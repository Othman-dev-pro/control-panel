import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FCMMessage {
  to?: string;
  registration_ids?: string[];
  notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
  };
  data?: {
    [key: string]: string;
  };
  priority: "high" | "normal";
  content_available?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { user_id, title, message, type, related_id } = await req.json();
    
    if (!user_id || !title || !message) {
      throw new Error("Missing required fields: user_id, title, message");
    }

    // Get Firebase Server Key from secrets
    const firebaseServerKey = Deno.env.get("FIREBASE_SERVER_KEY");
    if (!firebaseServerKey) {
      console.log("Firebase Server Key not configured - skipping push notification");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Push notification skipped - Firebase not configured" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's active FCM tokens
    const { data: tokens, error: tokenError } = await serviceClient
      .from("fcm_tokens")
      .select("token, platform")
      .eq("user_id", user_id)
      .eq("is_active", true);

    if (tokenError) {
      console.error("Error fetching FCM tokens:", tokenError);
      throw new Error("Failed to fetch FCM tokens");
    }

    if (!tokens || tokens.length === 0) {
      console.log("No active FCM tokens found for user:", user_id);
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No active devices to notify" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prepare FCM message
    const fcmMessage: FCMMessage = {
      registration_ids: tokens.map(t => t.token),
      notification: {
        title: title,
        body: message,
        icon: "/favicon.ico",
        badge: "1",
      },
      data: {
        type: type || "info",
        related_id: related_id || "",
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      priority: "high",
      content_available: true,
    };

    // Send to Firebase Cloud Messaging
    const fcmResponse = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Authorization": `key=${firebaseServerKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fcmMessage),
    });

    const fcmResult = await fcmResponse.json();

    if (!fcmResponse.ok) {
      console.error("FCM Error:", fcmResult);
      throw new Error(`FCM request failed: ${fcmResult.error || "Unknown error"}`);
    }

    // Handle invalid tokens (clean up from database)
    if (fcmResult.results) {
      const invalidTokens: string[] = [];
      fcmResult.results.forEach((result: any, index: number) => {
        if (result.error === "InvalidRegistration" || result.error === "NotRegistered") {
          invalidTokens.push(tokens[index].token);
        }
      });

      // Remove invalid tokens from database
      if (invalidTokens.length > 0) {
        await serviceClient
          .from("fcm_tokens")
          .delete()
          .in("token", invalidTokens);
        console.log("Removed", invalidTokens.length, "invalid FCM tokens");
      }
    }

    console.log("Push notification sent successfully:", {
      user_id,
      tokens_count: tokens.length,
      success_count: fcmResult.success,
      failure_count: fcmResult.failure,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      tokens_sent: tokens.length,
      fcm_success: fcmResult.success,
      fcm_failure: fcmResult.failure,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Push notification error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Internal server error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});