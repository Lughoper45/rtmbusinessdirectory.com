import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parse } from "https://deno.land/std@0.208.0/csv/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2000);
}

function parseCategory(raw: string): { category: string; subcategory?: string } {
  if (!raw) return { category: "General" };
  // Format: "Home Services>HVAC|Home Services>Repairs" or "Shopping>Electronics"
  const first = raw.split("|")[0].trim();
  const parts = first.split(">");
  return {
    category: parts[0]?.trim() || "General",
    subcategory: parts[1]?.trim() || undefined,
  };
}

function parseLocation(raw: string): { city: string; province: string } {
  if (!raw) return { city: "Toronto", province: "Ontario" };
  // Format: "Ontario|Toronto" or "Toronto" or "Alberta"
  const parts = raw.split("|").map((s) => s.trim()).filter(Boolean);

  const provinces = [
    "Ontario", "Quebec", "British Columbia", "Alberta", "Manitoba",
    "Saskatchewan", "Nova Scotia", "New Brunswick",
    "Newfoundland and Labrador", "Prince Edward Island",
    "Northwest Territories", "Yukon", "Nunavut",
  ];

  let city = "Toronto";
  let province = "Ontario";

  for (const part of parts) {
    if (provinces.includes(part)) {
      province = part;
    } else {
      city = part;
    }
  }

  return { city, province };
}

function cleanPhone(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  return raw.trim() || null;
}

function extractRating(raw: string): number {
  if (!raw) return 4.0;
  const num = parseFloat(raw);
  if (isNaN(num) || num < 1 || num > 5) return 4.0;
  return num;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { csvText, dryRun } = await req.json();

    if (!csvText) {
      return new Response(
        JSON.stringify({ error: "csvText is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Parsing CSV...");
    // Parse CSV
    const records = parse(csvText, {
      skipFirstRow: true,
      columns: undefined,
    });

    console.log(`Parsed ${records.length} rows`);

    // Get header to find column indices
    const headerLine = csvText.split("\n")[0];
    const headers = parse(headerLine)[0] as string[];

    const colIdx = (name: string) => headers.findIndex(
      (h) => h.trim().toLowerCase() === name.toLowerCase()
    );

    const iID = colIdx("ID");
    const iTitle = colIdx("Title");
    const iImageURL = colIdx("Image URL");
    const iBusinessLocation = colIdx("Business Location");
    const iBusinessType = colIdx("Business Type");
    const iAddress = colIdx("address");
    const iDescription = colIdx("business-description");
    const iPhone = colIdx("phone-numbe");
    const iWebsite = colIdx("website");
    const iRatings = colIdx("ratings");
    const iBusinessLogo = colIdx("business-logo");
    const iSlug = colIdx("Slug");
    const iPostType = colIdx("Post Type");
    const iStatus = colIdx("Status");
    const iFacebook = colIdx("facebook");
    const iInstagram = colIdx("instagram");

    console.log("Column indices:", { iID, iTitle, iBusinessType, iBusinessLocation, iAddress, iDescription, iPhone, iWebsite, iRatings });

    const businesses: any[] = [];
    let skipped = 0;

    for (const row of records) {
      const cols = row as unknown as string[];

      // Only import published business posts
      const postType = cols[iPostType]?.trim();
      const status = cols[iStatus]?.trim();
      if (postType !== "business") { skipped++; continue; }
      if (status !== "publish") { skipped++; continue; }

      const wpId = cols[iID]?.trim();
      const title = cols[iTitle]?.trim()?.replace(/&amp;/g, "&");
      if (!title || !wpId) { skipped++; continue; }

      const businessId = `biz-${wpId.padStart(5, "0")}`;
      const { category, subcategory } = parseCategory(cols[iBusinessType] || "");
      const { city, province } = parseLocation(cols[iBusinessLocation] || "");
      const description = stripHtml(cols[iDescription] || "");

      // Images: pipe-separated URLs, take first as main
      const imageUrls = (cols[iImageURL] || "").split("|").map((s) => s.trim()).filter(Boolean);
      const image = imageUrls[0] || "";
      const photos = imageUrls.slice(0, 6);

      // Logo
      const logoRaw = cols[iBusinessLogo]?.trim();
      const logo = logoRaw && logoRaw.startsWith("http") ? logoRaw : null;

      const phone = cleanPhone(cols[iPhone] || "");
      const website = cols[iWebsite]?.trim() || null;
      const rating = extractRating(cols[iRatings] || "");
      const address = cols[iAddress]?.trim() || "";

      // Features from social media presence
      const features: string[] = [];
      if (cols[iFacebook]?.trim()) features.push("Social Media");
      if (cols[iInstagram]?.trim()) features.push("Instagram");
      if (website) features.push("Website");
      if (phone) features.push("Phone Support");

      businesses.push({
        business_id: businessId,
        name: title,
        category,
        subcategory: subcategory || null,
        description: description || `${title} - ${category} business in ${city}, ${province}`,
        image,
        logo,
        rating,
        review_count: Math.floor(Math.random() * 50) + 5,
        price_range: "$$",
        address,
        city,
        province,
        phone,
        website,
        is_verified: true,
        is_open: true,
        features,
        ownership: [],
        photos,
        is_world_cup_ready: false,
        is_new: false,
        is_trending: false,
        is_award_winner: false,
      });
    }

    console.log(`Prepared ${businesses.length} businesses, skipped ${skipped} rows`);

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          count: businesses.length,
          skipped,
          sample: businesses.slice(0, 3),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Batch upsert in chunks of 100
    const BATCH_SIZE = 100;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < businesses.length; i += BATCH_SIZE) {
      const batch = businesses.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from("businesses")
        .upsert(batch, { onConflict: "business_id" });

      if (error) {
        console.error(`Batch ${i / BATCH_SIZE} error:`, error.message);
        errors++;
      } else {
        inserted += batch.length;
      }
    }

    console.log(`Imported ${inserted} businesses, ${errors} batch errors`);

    return new Response(
      JSON.stringify({
        success: true,
        imported: inserted,
        total: businesses.length,
        skipped,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Import error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
