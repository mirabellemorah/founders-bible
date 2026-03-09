import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { GoogleAuth } from "https://esm.sh/google-auth-library@9.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReqPayload {
  userId?: string;
  title: string;
  body: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, title, body } = await req.json() as ReqPayload;

    // Retrieve tokens from DB
    let query = supabase.from("push_tokens").select("token");
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { data: tokensData, error } = await query;

    if (error || !tokensData || tokensData.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "No tokens found" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const tokens = tokensData.map((t) => t.token);

    // To send via FCM v1 HTTP API, you need a Google Service Account key JSON string stored in secrets
    const serviceAccountStr = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_KEY");
    if (!serviceAccountStr) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not configured in Supabase secrets");
    }

    const serviceAccount = JSON.parse(serviceAccountStr);
    const auth = new GoogleAuth({
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key,
      },
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const projectId = serviceAccount.project_id;
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    const sendPromises = tokens.map(async (token) => {
      const res = await fetch(fcmUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
          },
        }),
      });
      return res.json();
    });

    const results = await Promise.all(sendPromises);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});