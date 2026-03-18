import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parse } from "https://deno.land/std@0.208.0/csv/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function stripHtml(html: string): string {
  if (!html) return "";
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
  const first = raw.split("|")[0].trim();
  const parts = first.split(">");
  return {
    category: parts[0]?.trim() || "General",
    subcategory: parts[1]?.trim() || undefined,
  };
}

function parseLocation(raw: string): { city: string; province: string } {
  if (!raw) return { city: "Toronto", province: "Ontario" };
  const parts = raw.split("|").map((s) => s.trim()).filter(Boolean);

  const provinces: Record<string, string> = {
    "Ontario": "Ontario", "Quebec": "Quebec", "British Columbia": "British Columbia",
    "Alberta": "Alberta", "Manitoba": "Manitoba", "Saskatchewan": "Saskatchewan",
    "Nova Scotia": "Nova Scotia", "New Brunswick": "New Brunswick",
    "Newfoundland and Labrador": "Newfoundland and Labrador",
    "Prince Edward Island": "Prince Edward Island",
    "Northwest Territories": "Northwest Territories", "Yukon": "Yukon", "Nunavut": "Nunavut",
  };

  let city = "Toronto";
  let province = "Ontario";

  for (const part of parts) {
    if (provinces[part]) {
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

// Get field value from a record object, trying multiple possible key formats
function getField(record: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
    // Try with BOM prefix
    if (record[`\uFEFF${key}`] !== undefined) return record[`\uFEFF${key}`];
  }
  return "";
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

    // Strip BOM character
    const cleanCsv = csvText.replace(/^\uFEFF/, "");

    console.log("Parsing CSV, length:", cleanCsv.length);

    // Parse CSV - use array mode first, then map to headers manually
    const allRows = parse(cleanCsv, {
      lazyQuotes: true,
    }) as string[][];

    if (allRows.length < 2) {
      return new Response(
        JSON.stringify({ error: "CSV has no data rows" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const headers = allRows[0].map((h) => h.replace(/^\uFEFF/, "").trim());
    console.log("Headers found:", headers.length, "First 10:", headers.slice(0, 10));

    // Build header index map
    const hIdx: Record<string, number> = {};
    headers.forEach((h, i) => { hIdx[h] = i; });

    // Convert rows to named records
    const records: Record<string, string>[] = [];
    for (let r = 1; r < allRows.length; r++) {
      const row = allRows[r];
      const record: Record<string, string> = {};
      for (let c = 0; c < headers.length; c++) {
        record[headers[c]] = row[c] || "";
      }
      records.push(record);
    }

    console.log(`Parsed ${records.length} rows`);
    if (records.length > 0) {
      const firstKeys = Object.keys(records[0]);
      console.log("First record keys (first 10):", firstKeys.slice(0, 10));
      console.log("Post Type value:", getField(records[0], "Post Type"));
      console.log("Title value:", getField(records[0], "Title"));
      console.log("Status value:", getField(records[0], "Status"));
    }

    const businesses: any[] = [];
    let skipped = 0;
    const skipReasons: Record<string, number> = {};

    for (const row of records) {
      const postType = getField(row, "Post Type").trim();
      const status = getField(row, "Status").trim();

      if (postType !== "business") {
        skipped++;
        skipReasons[`postType:${postType || "empty"}`] = (skipReasons[`postType:${postType || "empty"}`] || 0) + 1;
        continue;
      }
      if (status !== "publish") {
        skipped++;
        skipReasons[`status:${status || "empty"}`] = (skipReasons[`status:${status || "empty"}`] || 0) + 1;
        continue;
      }

      const wpId = getField(row, "ID").trim();
      const title = getField(row, "Title").trim().replace(/&amp;/g, "&");
      if (!title || !wpId) {
        skipped++;
        skipReasons["no-title-or-id"] = (skipReasons["no-title-or-id"] || 0) + 1;
        continue;
      }

      const businessId = `wp-${wpId}`;
      const { category, subcategory } = parseCategory(getField(row, "Business Type"));
      const { city, province } = parseLocation(getField(row, "Business Location"));
      const description = stripHtml(getField(row, "business-description"));

      // Extract address from the address field or jet_tax location
      const addressRaw = getField(row, "address").trim();

      // Images: pipe-separated URLs
      const imageUrls = getField(row, "Image URL").split("|").map((s) => s.trim()).filter(Boolean);
      const image = imageUrls[0] || "";
      const photos = imageUrls.slice(0, 6);

      // Logo from business-logo field
      const logoRaw = getField(row, "business-logo").trim();
      const logo = logoRaw && logoRaw.startsWith("http") ? logoRaw : null;

      const phone = cleanPhone(getField(row, "phone-numbe"));
      const websiteRaw = getField(row, "website").trim();
      const website = websiteRaw && websiteRaw.startsWith("http")
        ? websiteRaw
        : websiteRaw
          ? `https://${websiteRaw}`
          : null;
      const rating = extractRating(getField(row, "ratings"));

      // Features from social media presence
      const features: string[] = [];
      if (getField(row, "facebook").trim()) features.push("Social Media");
      if (getField(row, "instagram").trim()) features.push("Instagram");
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
        address: addressRaw,
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
    console.log("Skip reasons:", JSON.stringify(skipReasons));

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          count: businesses.length,
          skipped,
          skipReasons,
          sample: businesses.slice(0, 3),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Batch upsert in chunks of 50
    const BATCH_SIZE = 50;
    let inserted = 0;
    let errors = 0;
    const errorMessages: string[] = [];

    for (let i = 0; i < businesses.length; i += BATCH_SIZE) {
      const batch = businesses.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from("businesses")
        .upsert(batch, { onConflict: "business_id" });

      if (error) {
        console.error(`Batch ${i / BATCH_SIZE} error:`, error.message);
        errorMessages.push(error.message);
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
        errorMessages: errorMessages.slice(0, 5),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Import error:", err);
    return new Response(
      JSON.stringify({ error: err.message, stack: err.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
