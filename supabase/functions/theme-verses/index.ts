import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { theme } = await req.json();
    if (!theme) throw new Error("theme is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `You are a Bible scholar. For the theme "${theme}", provide exactly 8 Bible verse references that are highly relevant. Include verses from BOTH Old and New Testament. Pick powerful, well-known verses as well as hidden gems.

Return ONLY a JSON array of objects with these fields:
- reference: the verse reference (e.g. "Proverbs 3:5-6")
- reason: one sentence explaining why this verse relates to "${theme}" for entrepreneurs/founders

Example format:
[{"reference":"Proverbs 3:5-6","reason":"Trusting God's plan over your own understanding is essential for founders facing uncertainty."}]

Return ONLY the JSON array, no markdown, no explanation.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Extract JSON from potential markdown code blocks
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const verses = JSON.parse(jsonStr);

    return new Response(JSON.stringify({ verses }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("theme-verses error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", verses: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
