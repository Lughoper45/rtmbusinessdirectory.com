// Database-backed data layer - replaces mock data with real Supabase queries
import { supabase } from "@/integrations/supabase/client";
import type { Business } from "@/types/directory";
import { rtmBusinesses } from "./rtmBusinesses";
import { generateAllBusinesses } from "./businessGenerator";

const RTM_DATA = rtmBusinesses.filter(b => b.name && b.name.length > 2);
const GENERATED_DATA = generateAllBusinesses(5000, 42);
const LOCAL_DATA: Business[] = [...RTM_DATA, ...GENERATED_DATA];

function getLocalPaginatedBusinesses(
  page: number = 1,
  pageSize: number = 24,
  filters?: {
    city?: string;
    province?: string;
    category?: string;
    search?: string;
    minRating?: number;
    ownership?: string;
    worldCupReady?: boolean;
  }
): { businesses: Business[]; total: number; pages: number } {
  let filtered = LOCAL_DATA;

  if (filters?.city) {
    filtered = filtered.filter(b => b.city.toLowerCase() === filters.city!.toLowerCase());
  }
  if (filters?.province) {
    filtered = filtered.filter(b => b.province === filters.province);
  }
  if (filters?.category) {
    filtered = filtered.filter(b =>
      b.category.toLowerCase().includes(filters.category!.toLowerCase())
    );
  }
  if (filters?.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(b =>
      b.name.toLowerCase().includes(search) ||
      b.category.toLowerCase().includes(search) ||
      b.city.toLowerCase().includes(search)
    );
  }
  if (filters?.minRating) {
    filtered = filtered.filter(b => b.rating >= filters.minRating!);
  }
  if (filters?.ownership) {
    filtered = filtered.filter(b => b.ownership.includes(filters.ownership!));
  }
  if (filters?.worldCupReady) {
    filtered = filtered.filter(b => b.isWorldCupReady);
  }

  const start = (page - 1) * pageSize;
  const businesses = filtered.slice(start, start + pageSize);

  return {
    businesses,
    total: filtered.length,
    pages: Math.ceil(filtered.length / pageSize),
  };
}

// Map database row to Business type
function mapRowToBusiness(row: any): Business {
  return {
    id: row.business_id,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory || undefined,
    description: row.description || "",
    image: row.image || "",
    logo: row.logo || undefined,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    priceRange: row.price_range as Business["priceRange"],
    address: row.address,
    city: row.city,
    province: row.province,
    distance: row.distance ? Number(row.distance) : undefined,
    isOpen: row.is_open,
    closingTime: row.closing_time || undefined,
    phone: row.phone || undefined,
    website: row.website || undefined,
    isVerified: row.is_verified,
    isWorldCupReady: row.is_world_cup_ready,
    isNew: row.is_new,
    isTrending: row.is_trending,
    isAwardWinner: row.is_award_winner,
    features: row.features || [],
    ownership: row.ownership || [],
    cuisine: row.cuisine || undefined,
    recentReview: row.recent_review_text
      ? {
          text: row.recent_review_text,
          author: row.recent_review_author || "Anonymous",
          rating: row.recent_review_rating || 5,
        }
      : undefined,
    coordinates: row.lat && row.lng
      ? { lat: Number(row.lat), lng: Number(row.lng) }
      : undefined,
    photos: row.photos || [],
  };
}

// Fetch paginated businesses with filters
export async function fetchPaginatedBusinesses(
  page: number = 1,
  pageSize: number = 24,
  filters?: {
    city?: string;
    province?: string;
    category?: string;
    search?: string;
    minRating?: number;
    ownership?: string;
    worldCupReady?: boolean;
  }
): Promise<{ businesses: Business[]; total: number; pages: number }> {
  let query = supabase
    .from("businesses")
    .select("*", { count: "exact" });

  if (filters?.city) {
    query = query.ilike("city", filters.city);
  }
  if (filters?.province) {
    query = query.ilike("province", filters.province);
  }
  if (filters?.category) {
    query = query.ilike("category", `%${filters.category}%`);
  }
  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,category.ilike.%${filters.search}%,city.ilike.%${filters.search}%`
    );
  }
  if (filters?.minRating) {
    query = query.gte("rating", filters.minRating);
  }
  if (filters?.ownership) {
    query = query.contains("ownership", [filters.ownership]);
  }
  if (filters?.worldCupReady) {
    query = query.eq("is_world_cup_ready", true);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order("rating", { ascending: false })
    .range(from, to);

  if (error) {
    console.warn("Supabase error, falling back to local data:", error.message);
    return getLocalPaginatedBusinesses(page, pageSize, filters);
  }

  // If no data from Supabase, use local data
  if (!data || data.length === 0) {
    console.log("No businesses in database, using local data");
    return getLocalPaginatedBusinesses(page, pageSize, filters);
  }

  const total = count || 0;
  return {
    businesses: (data || []).map(mapRowToBusiness),
    total,
    pages: Math.ceil(total / pageSize),
  };
}

// Fetch a single business by its business_id (e.g. "biz-00001")
export async function fetchBusinessById(businessId: string): Promise<Business | null> {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    console.warn("Supabase error, looking locally:", error.message);
  }
  
  if (error || !data) {
    // Fallback to local data
    return LOCAL_DATA.find(b => b.id === businessId) || null;
  }
  return mapRowToBusiness(data);
}

// Fetch business by slug - extract business_id after "--" separator
export async function fetchBusinessBySlug(slug: string): Promise<Business | null> {
  // New format: "business-name--wp-123" or "business-name--biz-00001"
  const separatorIdx = slug.indexOf("--");
  if (separatorIdx !== -1) {
    const businessId = slug.substring(separatorIdx + 2);
    return fetchBusinessById(businessId);
  }
  // Legacy format: "business-name-00001" (5-digit suffix)
  const match = slug.match(/(\d{5})$/);
  if (match) return fetchBusinessById(`biz-${match[1]}`);
  // Fallback to local search
  const q = slug.toLowerCase();
  return LOCAL_DATA.find(b => 
    b.name.toLowerCase().includes(q) || b.id.includes(q)
  ) || null;
}

// Fetch similar businesses (same category, exclude current)
export async function fetchSimilarBusinesses(
  businessId: string,
  category: string,
  limit: number = 4
): Promise<Business[]> {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("category", category)
    .neq("business_id", businessId)
    .order("rating", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(mapRowToBusiness);
}

// Fetch competitors (same category + city)
export async function fetchCompetitors(
  businessId: string,
  category: string,
  city: string,
  limit: number = 5
): Promise<Business[]> {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("category", category)
    .eq("city", city)
    .neq("business_id", businessId)
    .order("rating", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(mapRowToBusiness);
}

// Fetch saved businesses by IDs
export async function fetchBusinessesByIds(ids: string[]): Promise<Business[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .in("business_id", ids);

  if (error || !data) return [];
  return data.map(mapRowToBusiness);
}

// Get total business count
export async function fetchBusinessCount(): Promise<number> {
  const { count, error } = await supabase
    .from("businesses")
    .select("*", { count: "exact", head: true });

  if (error) return 0;
  return count || 0;
}
