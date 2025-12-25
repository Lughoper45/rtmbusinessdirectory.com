// Main data index - generates and exports 10,000 Canadian businesses
import { generateAllBusinesses, CANADIAN_CITIES, BUSINESS_CATEGORIES } from './businessGenerator';
import type { Business } from '@/types/directory';

// Generate 10,000 businesses with consistent seed
const ALL_BUSINESSES: Business[] = generateAllBusinesses(10000, 42);

// Export all businesses
export const allBusinesses = ALL_BUSINESSES;

// Get businesses by city
export function getBusinessesByCity(city: string): Business[] {
  return ALL_BUSINESSES.filter(b => b.city.toLowerCase() === city.toLowerCase());
}

// Get businesses by category
export function getBusinessesByCategory(category: string): Business[] {
  return ALL_BUSINESSES.filter(b => b.category.toLowerCase().includes(category.toLowerCase()));
}

// Get paginated businesses
export function getPaginatedBusinesses(
  page: number = 1, 
  pageSize: number = 24,
  filters?: {
    city?: string;
    category?: string;
    search?: string;
    minRating?: number;
  }
): { businesses: Business[]; total: number; pages: number } {
  let filtered = ALL_BUSINESSES;
  
  if (filters?.city) {
    filtered = filtered.filter(b => b.city.toLowerCase() === filters.city!.toLowerCase());
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
    pages: Math.ceil(filtered.length / pageSize)
  };
}

// Get business by slug/id
export function getBusinessById(id: string): Business | undefined {
  return ALL_BUSINESSES.find(b => b.id === id);
}

// Get business by slug (from URL)
export function getBusinessBySlug(slug: string): Business | undefined {
  // Extract ID from slug (e.g., "maple-kitchen-00001" -> "biz-00001")
  const match = slug.match(/(\d{5})$/);
  if (match) {
    return getBusinessById(`biz-${match[1]}`);
  }
  return undefined;
}

// Stats
export const businessStats = {
  total: ALL_BUSINESSES.length,
  byCity: Object.fromEntries(
    Object.keys(CANADIAN_CITIES).map(city => [
      city,
      ALL_BUSINESSES.filter(b => b.city.toLowerCase() === city.toLowerCase()).length
    ])
  ),
  byCategory: Object.fromEntries(
    Object.keys(BUSINESS_CATEGORIES).map(cat => [
      cat,
      ALL_BUSINESSES.filter(b => 
        b.category.toLowerCase().includes(BUSINESS_CATEGORIES[cat as keyof typeof BUSINESS_CATEGORIES].name.toLowerCase().split(' ')[0])
      ).length
    ])
  )
};

// Export constants
export { CANADIAN_CITIES, BUSINESS_CATEGORIES };
