import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { business }: { business: BusinessInput } = await req.json();
    
    if (!business || !business.name) {
      return new Response(
        JSON.stringify({ error: 'Business data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
Features: ${business.features.join(', ')}
Ownership: ${business.ownership.join(', ')}
${business.isWorldCupReady ? 'Special: FIFA World Cup 2026 Ready - prepared for international visitors' : ''}
${business.isVerified ? 'Status: Verified Business' : ''}

Write an engaging, SEO-optimized description that would appear on their premium profile page.`;

    console.log(`Generating description for: ${business.name}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate description" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content;

    if (!description) {
      console.error("No content in AI response:", data);
      return new Response(
        JSON.stringify({ error: "No description generated" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully generated description for: ${business.name}`);

    return new Response(
      JSON.stringify({ 
        description,
        businessId: business.name,
        generatedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error generating description:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
