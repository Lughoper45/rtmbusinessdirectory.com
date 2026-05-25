import { supabase } from '@/integrations/supabase/client';
import type { Business } from '@/types/directory';

export interface BusinessFilters {
  city?: string;
  province?: string;
  category?: string;
  search?: string;
  minRating?: number;
  priceRange?: string;
  ownership?: string[];
  isVerified?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface BusinessRow {
  id: string;
  business_id: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string;
  image: string;
  logo: string | null;
  rating: number;
  review_count: number;
  price_range: string;
  address: string;
  city: string;
  province: string;
  lat: number | null;
  lng: number | null;
  is_open: boolean;
  closing_time: string | null;
  phone: string | null;
  website: string | null;
  is_verified: boolean;
  is_world_cup_ready: boolean;
  is_new: boolean;
  is_trending: boolean;
  is_award_winner: boolean;
  features: string[];
  ownership: string[];
  cuisine: string | null;
  recent_review_text: string | null;
  recent_review_author: string | null;
  recent_review_rating: number | null;
  photos: string[];
  created_at: string;
  updated_at: string;
}

function businessFromRow(row: BusinessRow): Business {
  return {
    id: row.business_id,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory || undefined,
    description: row.description,
    image: row.image,
    logo: row.logo || undefined,
    rating: row.rating,
    reviewCount: row.review_count,
    priceRange: row.price_range as '$' | '$$' | '$$$' | '$$$$',
    address: row.address,
    city: row.city,
    province: row.province,
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
    recentReview: row.recent_review_text ? {
      text: row.recent_review_text,
      author: row.recent_review_author || 'Anonymous',
      rating: row.recent_review_rating || 0,
    } : undefined,
    coordinates: row.lat && row.lng ? { lat: row.lat, lng: row.lng } : undefined,
    photos: row.photos || [],
  };
}

export async function getBusinesses(filters: BusinessFilters = {}): Promise<PaginatedResult<Business>> {
  const {
    city,
    province,
    category,
    search,
    minRating,
    priceRange,
    ownership,
    isVerified,
    page = 1,
    pageSize = 24,
  } = filters;

  let query = (supabase as any)
    .from('businesses')
    .select('*', { count: 'exact' });

  if (city) {
    query = query.ilike('city', city);
  }

  if (province) {
    query = query.eq('province', province);
  }

  if (category) {
    query = query.ilike('category', `%${category}%`);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%,city.ilike.%${search}%`);
  }

  if (minRating !== undefined) {
    query = query.gte('rating', minRating);
  }

  if (priceRange) {
    query = query.eq('price_range', priceRange);
  }

  if (isVerified !== undefined) {
    query = query.eq('is_verified', isVerified);
  }

  if (ownership && ownership.length > 0) {
    query = query.overlaps('ownership', ownership);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query
    .order('rating', { ascending: false, nullsFirst: false })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching businesses:', error);
    throw error;
  }

  return {
    data: (data as BusinessRow[] || []).map(businessFromRow),
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function getBusinessById(businessId: string): Promise<Business | null> {
  const { data, error } = await (supabase as any)
    .from('businesses')
    .select('*')
    .eq('business_id', businessId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching business:', error);
    throw error;
  }

  return businessFromRow(data as BusinessRow);
}

export async function getFeaturedBusinesses(limit = 8): Promise<Business[]> {
  const { data, error } = await (supabase as any)
    .from('businesses')
    .select('*')
    .or(`is_verified.eq.true,is_trending.eq.true,is_award_winner.eq.true`)
    .order('rating', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching featured businesses:', error);
    throw error;
  }

  return (data as BusinessRow[] || []).map(businessFromRow);
}

export async function getTrendingBusinesses(limit = 6): Promise<Business[]> {
  const { data, error } = await (supabase as any)
    .from('businesses')
    .select('*')
    .eq('is_trending', true)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching trending businesses:', error);
    throw error;
  }

  return (data as BusinessRow[] || []).map(businessFromRow);
}

export async function getNewBusinesses(limit = 6): Promise<Business[]> {
  const { data, error } = await (supabase as any)
    .from('businesses')
    .select('*')
    .eq('is_new', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching new businesses:', error);
    throw error;
  }

  return (data as BusinessRow[] || []).map(businessFromRow);
}

export async function getBusinessesByCity(city: string, limit = 12): Promise<Business[]> {
  const { data, error } = await (supabase as any)
    .from('businesses')
    .select('*')
    .ilike('city', city)
    .order('rating', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching businesses by city:', error);
    throw error;
  }

  return (data as BusinessRow[] || []).map(businessFromRow);
}

export async function getBusinessesByProvince(province: string, limit = 12): Promise<Business[]> {
  const { data, error } = await (supabase as any)
    .from('businesses')
    .select('*')
    .eq('province', province)
    .order('rating', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching businesses by province:', error);
    throw error;
  }

  return (data as BusinessRow[] || []).map(businessFromRow);
}

export async function getCategories(): Promise<{ category: string; count: number }[]> {
  const { data, error } = await (supabase as any)
    .from('businesses')
    .select('category');

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  const counts: Record<string, number> = {};
  (data as { category: string }[] || []).forEach(b => {
    counts[b.category] = (counts[b.category] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getProvinces(): Promise<{ province: string; count: number }[]> {
  const { data, error } = await (supabase as any)
    .from('businesses')
    .select('province');

  if (error) {
    console.error('Error fetching provinces:', error);
    throw error;
  }

  const counts: Record<string, number> = {};
  (data as { province: string }[] || []).forEach(b => {
    counts[b.province] = (counts[b.province] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([province, count]) => ({ province, count }))
    .sort((a, b) => b.count - a.count);
}

export async function searchBusinesses(query: string, limit = 10): Promise<Business[]> {
  const { data, error } = await (supabase as any)
    .from('businesses')
    .select('*')
    .or(`name.ilike.%${query}%,category.ilike.%${query}%,city.ilike.%${query}%`)
    .limit(limit);

  if (error) {
    console.error('Error searching businesses:', error);
    throw error;
  }

  return (data as BusinessRow[] || []).map(businessFromRow);
}

export async function getBusinessStats(): Promise<{
  total: number;
  verified: number;
  byProvince: Record<string, number>;
  byCategory: Record<string, number>;
}> {
  const { data, error } = await (supabase as any)
    .from('businesses')
    .select('province,category,is_verified');

  if (error) {
    console.error('Error fetching business stats:', error);
    throw error;
  }

  const stats = {
    total: data?.length || 0,
    verified: 0,
    byProvince: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
  };

  (data as { province: string; category: string; is_verified: boolean }[] || []).forEach(b => {
    if (b.is_verified) stats.verified++;
    stats.byProvince[b.province] = (stats.byProvince[b.province] || 0) + 1;
    stats.byCategory[b.category] = (stats.byCategory[b.category] || 0) + 1;
  });

  return stats;
}

export async function claimBusiness(
  businessId: string,
  email: string,
  userId: string,
): Promise<{ success: boolean; message: string; claimId?: string }> {
  const verificationToken = crypto.randomUUID();

  const { data: claim, error } = await (supabase as any)
    .from('business_claims')
    .insert({
      business_id: businessId,
      user_id: userId,
      business_email: email,
      status: 'pending',
      verification_token: verificationToken,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, message: 'You already submitted a claim for this business.' };
    }
    return { success: false, message: error.message };
  }

  const { data: biz } = await (supabase as any)
    .from('businesses')
    .select('name')
    .eq('business_id', businessId)
    .maybeSingle();

  const site =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://www.rtmbusinessdirectory.com';
  const claimUrl = `${site}/claim?claimId=${claim.id}&token=${encodeURIComponent(verificationToken)}`;

  try {
    await supabase.functions.invoke('send-claim-email', {
      body: {
        action: 'verification',
        claimId: claim.id,
        businessId,
        email,
        businessName: biz?.name ?? 'your business',
        verificationToken,
        claimUrl,
      },
    });
  } catch (e) {
    console.warn('send-claim-email failed', e);
  }

  return {
    success: true,
    message: 'Claim request submitted. Check your email for verification.',
    claimId: claim.id,
  };
}

export async function saveBusiness(userId: string, businessId: string): Promise<{ success: boolean }> {
  const { error } = await (supabase as any)
    .from('saved_businesses')
    .insert({
      user_id: userId,
      business_id: businessId,
    });

  return { success: !error };
}

export async function unsaveBusiness(userId: string, businessId: string): Promise<{ success: boolean }> {
  const { error } = await (supabase as any)
    .from('saved_businesses')
    .delete()
    .eq('user_id', userId)
    .eq('business_id', businessId);

  return { success: !error };
}

export async function getSavedBusinesses(userId: string): Promise<Business[]> {
  const { data, error } = await (supabase as any)
    .from('saved_businesses')
    .select('business_id')
    .eq('user_id', userId);

  if (error || !data?.length) {
    return [];
  }

  const businessIds = data.map((s: { business_id: string }) => s.business_id);

  const { data: businesses, error: bizError } = await (supabase as any)
    .from('businesses')
    .select('*')
    .in('business_id', businessIds);

  if (bizError) {
    console.error('Error fetching saved businesses:', bizError);
    return [];
  }

  return (businesses as BusinessRow[] || []).map(businessFromRow);
}
