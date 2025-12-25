import { CANADIAN_CITIES, CITY_DISTRIBUTION, type CityKey } from './constants/canadianData';
import { BUSINESS_CATEGORIES, type CategoryKey } from './constants/categories';
import { 
  BUSINESS_NAME_PARTS, 
  CATEGORY_FEATURES, 
  OWNERSHIP_TYPES, 
  REVIEW_TEMPLATES,
  WORLD_CUP_FEATURES 
} from './constants/businessAttributes';
import type { Business } from '@/types/directory';

// Seeded random number generator for consistent data
class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }
  
  pick<T>(array: readonly T[] | T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
  
  pickMultiple<T>(array: readonly T[] | T[], count: number): T[] {
    const shuffled = [...array].sort(() => this.next() - 0.5);
    return shuffled.slice(0, count);
  }
  
  weightedPick<T extends { weight: number }>(items: T[]): T {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = this.next() * totalWeight;
    
    for (const item of items) {
      random -= item.weight;
      if (random <= 0) return item;
    }
    return items[items.length - 1];
  }
  
  boolean(probability: number = 0.5): boolean {
    return this.next() < probability;
  }
  
  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

// Generate a business name based on category
function generateBusinessName(
  category: CategoryKey, 
  cuisine: string | undefined,
  rng: SeededRandom
): string {
  const parts = BUSINESS_NAME_PARTS;
  
  // 30% chance to use a person's name
  if (rng.boolean(0.3)) {
    const firstName = rng.pick(parts.firstNames);
    const lastName = rng.pick(parts.lastNames);
    
    switch (category) {
      case 'restaurants':
        return rng.boolean(0.5) 
          ? `${firstName}'s ${rng.pick(parts.restaurantNames)}`
          : `${lastName} ${rng.pick(parts.restaurantNames)}`;
      case 'professional':
        return `${lastName} & ${rng.pick(parts.lastNames)} ${rng.pick(parts.serviceNames)}`;
      case 'homeServices':
        return `${lastName} ${rng.pick(parts.homeServiceNames)}`;
      default:
        return `${firstName}'s ${rng.pick(parts.retailNames)}`;
    }
  }
  
  // Generate name based on category
  const prefix = rng.boolean(0.6) ? rng.pick(parts.prefixes) + " " : "";
  
  switch (category) {
    case 'restaurants':
      if (cuisine && rng.boolean(0.4)) {
        return `${prefix}${cuisine} ${rng.pick(parts.restaurantNames)}`;
      }
      return `${prefix}${rng.pick(parts.restaurantNames)}`;
    
    case 'retail':
      return `${prefix}${rng.pick(parts.retailNames)}`;
    
    case 'professional':
      return `${prefix}${rng.pick(parts.serviceNames)}`;
    
    case 'health':
      return `${prefix}${rng.pick(parts.healthNames)}`;
    
    case 'homeServices':
      return `${prefix}${rng.pick(parts.homeServiceNames)}`;
    
    case 'entertainment':
      return `${prefix}${rng.pick(parts.restaurantNames)}`;
    
    case 'beauty':
      return `${prefix}${rng.pick(['Salon', 'Studio', 'Spa', 'Beauty', 'Style'])}`;
    
    default:
      return `${prefix}Business`;
  }
}

// Generate address
function generateAddress(city: CityKey, rng: SeededRandom): {
  address: string;
  neighborhood: string;
  postalCode: string;
  coordinates: { lat: number; lng: number };
} {
  const cityData = CANADIAN_CITIES[city];
  const streetNumber = rng.range(1, 2500);
  const street = rng.pick([...cityData.streets]);
  const neighborhood = rng.pick([...cityData.neighborhoods]);
  const postalPrefix = rng.pick([...cityData.postalPrefix]);
  const postalSuffix = `${rng.range(0, 9)}${String.fromCharCode(65 + rng.range(0, 25))}${rng.range(0, 9)}`;
  
  // Generate coordinates within ~10km of city center
  const latOffset = (rng.next() - 0.5) * 0.15;
  const lngOffset = (rng.next() - 0.5) * 0.2;
  
  return {
    address: `${streetNumber} ${street}`,
    neighborhood,
    postalCode: `${postalPrefix}${String.fromCharCode(65 + rng.range(0, 25))} ${postalSuffix}`,
    coordinates: {
      lat: cityData.coordinates.lat + latOffset,
      lng: cityData.coordinates.lng + lngOffset
    }
  };
}

// Generate a review
function generateReview(
  category: CategoryKey,
  city: string,
  neighborhood: string,
  rng: SeededRandom
): { text: string; author: string; rating: number } {
  const isPositive = rng.boolean(0.85);
  const templates = isPositive ? REVIEW_TEMPLATES.positive : REVIEW_TEMPLATES.neutral;
  const template = rng.pick(templates);
  
  const categoryKey = category as keyof typeof REVIEW_TEMPLATES.specifics;
  const specifics = REVIEW_TEMPLATES.specifics[categoryKey] || REVIEW_TEMPLATES.specifics.restaurants;
  const specific = rng.pick(specifics);
  
  const text = template
    .replace('{specific}', specific)
    .replace('{category}', BUSINESS_CATEGORIES[category].name.toLowerCase())
    .replace('{city}', city)
    .replace('{neighborhood}', neighborhood);
  
  return {
    text,
    author: rng.pick(REVIEW_TEMPLATES.reviewerNames),
    rating: isPositive ? rng.range(4, 5) : rng.range(3, 4)
  };
}

// Generate photos array
function generatePhotos(category: CategoryKey, rng: SeededRandom): string[] {
  const photoCount = rng.range(3, 8);
  const baseUrls = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', // restaurant
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5', // cafe
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0', // food
    'https://images.unsplash.com/photo-1559339352-11d035aa65de', // store
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d', // retail
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43', // professional
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d', // health
    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f' // beauty
  ];
  
  return rng.pickMultiple(baseUrls, photoCount).map(
    url => `${url}?w=800&h=600&fit=crop&auto=format&q=80`
  );
}

// Generate a single business
function generateBusiness(
  id: number,
  city: CityKey,
  category: CategoryKey,
  rng: SeededRandom
): Business {
  const cityData = CANADIAN_CITIES[city];
  const categoryData = BUSINESS_CATEGORIES[category];
  
  // Pick subcategory
  const subcategoryData = rng.weightedPick(
    [...categoryData.subcategories].map(s => ({ ...s, weight: s.weight }))
  );
  
  // Pick cuisine for restaurants
  const cuisine: string | undefined = category === 'restaurants' && 'cuisines' in categoryData
    ? rng.pick([...(categoryData as typeof BUSINESS_CATEGORIES.restaurants).cuisines])
    : undefined;
  
  // Generate location
  const location = generateAddress(city, rng);
  
  // Generate name
  const name = generateBusinessName(category, cuisine, rng);
  
  // Generate rating (weighted towards higher)
  const ratingBase = rng.next();
  const rating = Number((3.0 + ratingBase * 2.0).toFixed(1)); // 3.0 - 5.0
  const reviewCount = rng.range(5, 500);
  
  // Generate features
  const categoryFeatures = CATEGORY_FEATURES[category] || CATEGORY_FEATURES.restaurants;
  const features = rng.pickMultiple(categoryFeatures, rng.range(3, 7));
  
  // Generate ownership
  const ownership = OWNERSHIP_TYPES
    .filter(() => rng.boolean(0.15))
    .map(o => o.name)
    .slice(0, 3);
  
  if (ownership.length === 0 && rng.boolean(0.7)) {
    ownership.push("Canadian-Owned");
  }
  
  // World Cup ready?
  const isWorldCupReady = rng.boolean(0.25);
  if (isWorldCupReady) {
    features.push(...rng.pickMultiple(WORLD_CUP_FEATURES, rng.range(2, 4)));
  }
  
  // Generate hours
  const isOpen = rng.boolean(0.7);
  const closingHour = rng.range(17, 23);
  
  // Generate price range
  const priceRanges: ("$" | "$$" | "$$$" | "$$$$")[] = ["$", "$$", "$$$", "$$$$"];
  const priceRange = rng.weightedPick([
    { value: "$" as const, weight: 0.25 },
    { value: "$$" as const, weight: 0.40 },
    { value: "$$$" as const, weight: 0.25 },
    { value: "$$$$" as const, weight: 0.10 }
  ]).value;
  
  // Generate slug
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + 
    `-${id}`;
  
  // Generate business
  const business: Business = {
    id: `biz-${id.toString().padStart(5, '0')}`,
    name,
    category: categoryData.name,
    subcategory: subcategoryData.name,
    description: "", // Will be AI-generated later
    image: generatePhotos(category, rng)[0],
    logo: undefined,
    rating,
    reviewCount,
    priceRange,
    address: location.address,
    city: cityData.name,
    province: cityData.province,
    distance: rng.boolean(0.8) ? Number((rng.next() * 10).toFixed(1)) : undefined,
    isOpen,
    closingTime: isOpen ? `${closingHour}:00 PM` : undefined,
    phone: `(${cityData.areaCode}) ${rng.range(200, 999)}-${rng.range(1000, 9999)}`,
    website: rng.boolean(0.6) ? `https://${slug.split('-').slice(0, 2).join('')}.ca` : undefined,
    isVerified: rng.boolean(0.4),
    isWorldCupReady,
    isNew: rng.boolean(0.1),
    isTrending: rng.boolean(0.08),
    isAwardWinner: rng.boolean(0.05),
    features: [...new Set(features)],
    ownership,
    cuisine,
    recentReview: generateReview(category, cityData.name, location.neighborhood, rng),
    coordinates: location.coordinates,
    photos: generatePhotos(category, rng)
  };
  
  return business;
}

// Select category based on distribution
function selectCategory(rng: SeededRandom): CategoryKey {
  const categories = Object.entries(BUSINESS_CATEGORIES).map(([key, value]) => ({
    key: key as CategoryKey,
    weight: value.distribution
  }));
  
  const selected = rng.weightedPick(categories.map(c => ({ ...c, weight: c.weight })));
  return selected.key;
}

// Select city based on distribution
function selectCity(rng: SeededRandom): CityKey {
  const cities = Object.entries(CITY_DISTRIBUTION).map(([key, weight]) => ({
    key: key as CityKey,
    weight: weight as number
  }));
  
  const selected = rng.weightedPick(cities);
  return selected.key;
}

// Generate all businesses
export function generateAllBusinesses(count: number = 10000, seed: number = 12345): Business[] {
  const rng = new SeededRandom(seed);
  const businesses: Business[] = [];
  
  for (let i = 1; i <= count; i++) {
    const city = selectCity(rng);
    const category = selectCategory(rng);
    const business = generateBusiness(i, city, category, rng);
    businesses.push(business);
  }
  
  return businesses;
}

// Generate businesses for a specific city
export function generateBusinessesForCity(
  city: CityKey, 
  count: number, 
  startId: number = 1,
  seed: number = 12345
): Business[] {
  const rng = new SeededRandom(seed + startId);
  const businesses: Business[] = [];
  
  for (let i = 0; i < count; i++) {
    const category = selectCategory(rng);
    const business = generateBusiness(startId + i, city, category, rng);
    businesses.push(business);
  }
  
  return businesses;
}

// Generate businesses for a specific category
export function generateBusinessesForCategory(
  category: CategoryKey,
  count: number,
  startId: number = 1,
  seed: number = 12345
): Business[] {
  const rng = new SeededRandom(seed + startId);
  const businesses: Business[] = [];
  
  for (let i = 0; i < count; i++) {
    const city = selectCity(rng);
    const business = generateBusiness(startId + i, city, category, rng);
    businesses.push(business);
  }
  
  return businesses;
}

// Export city and category data for UI
export { CANADIAN_CITIES, CITY_DISTRIBUTION, BUSINESS_CATEGORIES };
