import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { AssistantError, openRouterChat } from "../_shared/openrouter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BusinessInput {
  name: string;
  category: string;
  city: string;
  province: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  features: string[];
  ownership: string[];
  isWorldCupReady?: boolean;
  isVerified?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { business }: { business: BusinessInput } = await req.json();

    if (!business || !business.name) {
      return new Response(
        JSON.stringify({ error: "Business data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const systemPrompt = `You are an expert SEO copywriter for Canadian business listings. Generate compelling, authentic business descriptions that:
- Are 2-3 paragraphs (150-200 words total)
- Highlight unique selling points
- Include local Canadian context
- Use natural SEO keywords
- Sound authentic, not generic
- Mention neighborhood/city when relevant
- Include call-to-action elements`;

    const userPrompt = `Generate a premium business profile description for:

Business: ${business.name}
Category: ${business.category}
Location: ${business.city}, ${business.province}
Rating: ${business.rating}/5 (${business.reviewCount} reviews)
Price Range: ${business.priceRange}
Features: ${business.features.join(", ")}
Ownership: ${business.ownership.join(", ")}
${business.isWorldCupReady ? "Special: FIFA World Cup 2026 Ready - prepared for international visitors" : ""}
${business.isVerified ? "Status: Verified Business" : ""}

Write an engaging, SEO-optimized description that would appear on their premium profile page.`;

    console.log(`Generating description for: ${business.name}`);

    const { text: description } = await openRouterChat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      maxTokens: 500,
      temperature: 0.6,
      httpReferer: "https://rtmbusinessdirectory.com",
      xTitle: "RTM Business Description Generator",
    });

    return new Response(
      JSON.stringify({
        description,
        businessId: business.name,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error generating description:", error);
    if (error instanceof AssistantError) {
      const status = error.code === "OPENROUTER_NOT_CONFIGURED" ? 503 : 502;
      return new Response(
        JSON.stringify({ error: error.message }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
