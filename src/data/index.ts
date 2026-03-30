import { CANADIAN_CITIES, CITY_DISTRIBUTION } from './constants/canadianData';
import type { Business } from '@/types/directory';
import {
  DIRECTORY_SOURCE_MODE,
  LOCAL_DATA,
  LOCAL_DATA_STATS,
  RTM_DATA,
} from './sourceConfig';
import {
  getBusinesses as getSupabaseBusinesses,
  getFeaturedBusinesses as getFeaturedFromSupabase,
  getTrendingBusinesses as getTrendingFromSupabase,
  getBusinessById as getBusinessFromSupabase,
  getCategories as getCategoriesFromSupabase,
  getProvinces as getProvincesFromSupabase,
  searchBusinesses as searchSupabaseBusinesses,
  getBusinessStats as getStatsFromSupabase,
  claimBusiness,
  saveBusiness,
  unsaveBusiness,
  getSavedBusinesses,
  type BusinessFilters,
  type PaginatedResult,
} from '@/services/businesses';

export const allBusinesses = LOCAL_DATA;

export function getLocalBusinesses(
  page: number = 1,
  pageSize: number = 24,
  filters?: {
    city?: string;
    province?: string;
    category?: string;
    search?: string;
    minRating?: number;
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
      b.city.toLowerCase().includes(search) ||
      b.description.toLowerCase().includes(search)
    );
  }
  if (filters?.minRating) {
    filtered = filtered.filter(b => b.rating >= filters.minRating!);
  }

  const start = (page - 1) * pageSize;
  const businesses = filtered.slice(start, start + pageSize);

  return {
    businesses,
    total: filtered.length,
    pages: Math.ceil(filtered.length / pageSize),
  };
}

export function getLocalBusinessById(id: string): Business | undefined {
  return LOCAL_DATA.find(b => b.id === id);
}

export function getLocalFeatured(limit = 8): Business[] {
  return LOCAL_DATA
    .filter(b => b.isVerified || b.isTrending || b.isAwardWinner)
    .slice(0, limit);
}

export function getLocalTrending(limit = 6): Business[] {
  return LOCAL_DATA
    .filter(b => b.isTrending)
    .slice(0, limit);
}

export function searchLocal(query: string, limit = 10): Business[] {
  const q = query.toLowerCase();
  return LOCAL_DATA
    .filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      b.city.toLowerCase().includes(q)
    )
    .slice(0, limit);
}

export function getLocalByCity(city: string): Business[] {
  return LOCAL_DATA.filter(b => b.city.toLowerCase() === city.toLowerCase());
}

export function getLocalByCategory(category: string): Business[] {
  return LOCAL_DATA.filter(b => b.category.toLowerCase().includes(category.toLowerCase()));
}

export function getLocalPaginatedBusinesses(
  page: number = 1,
  pageSize: number = 24,
  filters?: {
    city?: string;
    province?: string;
    category?: string;
    search?: string;
    minRating?: number;
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
    filtered = filtered.filter(b => b.category.toLowerCase().includes(filters.category!.toLowerCase()));
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

  const start = (page - 1) * pageSize;
  const businesses = filtered.slice(start, start + pageSize);

  return {
    businesses,
    total: filtered.length,
    pages: Math.ceil(filtered.length / pageSize),
  };
}

export function getLocalBySlug(slug: string): Business | undefined {
  const match = slug.match(/(\d{5})$/);
  if (match) {
    return getLocalBusinessById(`biz-${match[1]}`);
  }
  return undefined;
}

export async function getBusinesses(
  filters?: BusinessFilters
): Promise<PaginatedResult<Business>> {
  try {
    return await getSupabaseBusinesses(filters);
  } catch (error) {
    console.warn('Supabase unavailable, falling back to local data:', error);
    const { businesses, total, pages } = getLocalPaginatedBusinesses(
      filters?.page || 1,
      filters?.pageSize || 24,
      {
        city: filters?.city,
        province: filters?.province,
        category: filters?.category,
        search: filters?.search,
        minRating: filters?.minRating,
      }
    );
    return {
      data: businesses,
      total,
      page: filters?.page || 1,
      pageSize: filters?.pageSize || 24,
      totalPages: pages,
    };
  }
}

export async function getFeaturedBusinesses(limit = 8): Promise<Business[]> {
  try {
    return await getFeaturedFromSupabase(limit);
  } catch (error) {
    console.warn('Supabase unavailable, using local featured:', error);
    return getLocalFeatured(limit);
  }
}

export async function getTrendingBusinesses(limit = 6): Promise<Business[]> {
  try {
    return await getTrendingFromSupabase(limit);
  } catch (error) {
    console.warn('Supabase unavailable, using local trending:', error);
    return getLocalTrending(limit);
  }
}

export async function getBusinessById(id: string): Promise<Business | null> {
  try {
    const supabaseResult = await getBusinessFromSupabase(id);
    if (supabaseResult) return supabaseResult;
  } catch (error) {
    console.warn('Supabase unavailable, checking local:', error);
  }

  const localResult = getLocalBusinessById(id);
  return localResult || null;
}

export async function searchBusinesses(query: string, limit = 10): Promise<Business[]> {
  try {
    return await searchSupabaseBusinesses(query, limit);
  } catch (error) {
    console.warn('Supabase unavailable, searching local:', error);
    return searchLocal(query, limit);
  }
}

export async function getCategories(): Promise<{ category: string; count: number }[]> {
  try {
    return await getCategoriesFromSupabase();
  } catch (error) {
    const counts: Record<string, number> = {};
    LOCAL_DATA.forEach(b => {
      counts[b.category] = (counts[b.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }
}

export async function getProvinces(): Promise<{ province: string; count: number }[]> {
  try {
    return await getProvincesFromSupabase();
  } catch (error) {
    const counts: Record<string, number> = {};
    LOCAL_DATA.forEach(b => {
      counts[b.province] = (counts[b.province] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([province, count]) => ({ province, count }))
      .sort((a, b) => b.count - a.count);
  }
}

export async function getBusinessStats(): Promise<{
  total: number;
  verified: number;
  byProvince: Record<string, number>;
  byCategory: Record<string, number>;
}> {
  try {
    return await getStatsFromSupabase();
  } catch (error) {
    const stats = {
      total: LOCAL_DATA.length,
      verified: LOCAL_DATA.filter(b => b.isVerified).length,
      byProvince: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
    };
    LOCAL_DATA.forEach(b => {
      stats.byProvince[b.province] = (stats.byProvince[b.province] || 0) + 1;
      stats.byCategory[b.category] = (stats.byCategory[b.category] || 0) + 1;
    });
    return stats;
  }
}

export const businessStats = {
  total: LOCAL_DATA_STATS.total,
  rtmCount: LOCAL_DATA_STATS.rtmCount,
  generatedCount: LOCAL_DATA_STATS.generatedCount,
  sourceMode: DIRECTORY_SOURCE_MODE,
};

export { CANADIAN_CITIES, CITY_DISTRIBUTION };
export { claimBusiness, saveBusiness, unsaveBusiness, getSavedBusinesses };
export type { BusinessFilters, PaginatedResult };
