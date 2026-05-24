import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AssistantError, openRouterChat } from "../_shared/openrouter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { websiteUrl } = await req.json();

    if (!websiteUrl) {
      return new Response(
        JSON.stringify({ error: "Website URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let formattedUrl = websiteUrl.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log("Analyzing website:", formattedUrl);

    const { text: content } = await openRouterChat({
      messages: [
        {
          role: "system",
          content: `You are a business analyst AI. Given a website URL, analyze what you can infer about the business and return structured data. Be creative but realistic based on the URL structure and domain name. Return a JSON object with these fields:
- businessName: The likely business name (extract from domain or infer)
- description: A compelling 2-3 sentence business description (150-200 chars)
- businessType: One of: restaurant, retail, service, tech, health, construction
- suggestedCategory: A more specific category
- city: If detectable from URL, otherwise leave empty
- province: If detectable (Canadian provinces), otherwise leave empty

Return ONLY valid JSON, no markdown or explanation.`,
        },
        {
          role: "user",
          content: `Analyze this website URL and extract business information: ${formattedUrl}`,
        },
      ],
      maxTokens: 400,
      temperature: 0.7,
      httpReferer: "https://rtmbusinessdirectory.com",
      xTitle: "RTM Website Analyzer",
    });

    let businessInfo;
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      businessInfo = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      businessInfo = {
        businessName: "",
        description: "",
        businessType: "",
        suggestedCategory: "",
        city: "",
        province: "",
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: businessInfo,
        websiteUrl: formattedUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error analyzing website:", error);
    if (error instanceof AssistantError) {
      const status = error.code === "OPENROUTER_NOT_CONFIGURED" ? 503 : 502;
      return new Response(
        JSON.stringify({ error: error.message }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze website";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
