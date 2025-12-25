export type DiscoveryMode = "mission" | "map" | "discovery" | "best" | "story" | "saved" | "trending";

export interface Business {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  description: string;
  image: string;
  logo?: string;
  rating: number;
  reviewCount: number;
  priceRange: "$" | "$$" | "$$$" | "$$$$";
  address: string;
  city: string;
  province: string;
  distance?: number;
  isOpen: boolean;
  closingTime?: string;
  phone?: string;
  website?: string;
  isVerified: boolean;
  isWorldCupReady?: boolean;
  isNew?: boolean;
  isTrending?: boolean;
  isAwardWinner?: boolean;
  features: string[];
  ownership?: string[];
  cuisine?: string;
  recentReview?: {
    text: string;
    author: string;
    rating: number;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
  photos?: string[];
}

export interface FilterState {
  location: string;
  categories: string[];
  rating: number;
  priceRange: string[];
  features: string[];
  ownership: string[];
  openNow: boolean;
}

export interface SearchSuggestion {
  type: "suggestion" | "business" | "location" | "category";
  text: string;
  icon?: string;
  business?: Business;
}
