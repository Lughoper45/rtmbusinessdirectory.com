export interface BusinessInput {
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  image?: string;
  logo?: string;
  priceRange?: '$' | '$$' | '$$$' | '$$$$';
  address?: string;
  city: string;
  province: string;
  phone?: string;
  website?: string;
  features?: string[];
  ownership?: string[];
  lat?: number;
  lng?: number;
  photos?: string[];
  email?: string;
  facebook?: string;
  instagram?: string;
  hours?: string;
}

export interface BusinessDB {
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

export interface ReviewDB {
  id: string;
  business_id: string;
  user_id: string;
  rating: number;
  text: string;
  author_name: string;
  author_avatar: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessClaim {
  id: string;
  business_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  verification_token: string;
  business_email: string;
  verified_at: string | null;
  created_at: string;
}

export const BUSINESS_CATEGORIES = {
  restaurants: { 
    name: 'Restaurants', 
    icon: '🍽️',
    subcategories: ['Fine Dining', 'Casual Dining', 'Fast Food', 'Cafe', 'Bakery', 'Food Truck', 'Buffet', 'Pizzeria', 'Sushi', 'BBQ', 'Indian', 'Chinese', 'Italian', 'Mexican', 'Thai', 'Vietnamese', 'Korean', 'Japanese', 'Mediterranean', 'African', 'Caribbean']
  },
  retail: { 
    name: 'Shopping', 
    icon: '🛍️',
    subcategories: ['Clothing', 'Electronics', 'Furniture', 'Grocery', 'Books', 'Jewelry', 'Sports', 'Pet Store', 'Hardware', 'Garden', 'Auto Parts']
  },
  professional: { 
    name: 'Professional Services', 
    icon: '💼',
    subcategories: ['Lawyers', 'Accountants', 'Real Estate', 'Insurance', 'Marketing', 'IT Services', 'Consulting', 'Photography', 'Graphic Design', 'Staffing']
  },
  health: { 
    name: 'Health & Medical', 
    icon: '🏥',
    subcategories: ['Hospital', 'Clinic', 'Dentist', 'Optometrist', 'Pharmacy', 'Physiotherapy', 'Chiropractor', 'Mental Health', 'Dermatology', 'Pediatric']
  },
  homeServices: { 
    name: 'Home Services', 
    icon: '🏠',
    subcategories: ['Plumber', 'Electrician', 'HVAC', 'Roofing', 'Landscaping', 'Cleaning', 'Painting', 'Moving', 'Locksmith', 'Pest Control', 'Renovation']
  },
  automotive: { 
    name: 'Automotive', 
    icon: '🚗',
    subcategories: ['Auto Repair', 'Car Dealership', 'Gas Station', 'Car Wash', 'Tire Shop', 'Auto Parts', 'Body Shop', 'Motorcycle']
  },
  beauty: { 
    name: 'Beauty & Spa', 
    icon: '💅',
    subcategories: ['Hair Salon', 'Nail Salon', 'Spa', 'Barbershop', 'Makeup Artist', 'Esthetician', 'Massage Therapy', 'Waxing']
  },
  fitness: { 
    name: 'Fitness & Sports', 
    icon: '💪',
    subcategories: ['Gym', 'Yoga Studio', 'Swimming', 'Martial Arts', 'Tennis', 'Golf', 'Sports Team', 'Outdoor Gear']
  },
  education: { 
    name: 'Education', 
    icon: '📚',
    subcategories: ['School', 'University', 'College', 'Tutoring', 'Language School', 'Music School', 'Driving School', 'Dance School']
  },
  financial: { 
    name: 'Banking & Finance', 
    icon: '💰',
    subcategories: ['Bank', 'Credit Union', 'Investment', 'Tax Services', 'Bookkeeping', 'Payday Loans', 'Currency Exchange']
  },
  entertainment: { 
    name: 'Arts & Entertainment', 
    icon: '🎭',
    subcategories: ['Movie Theater', 'Concert Hall', 'Museum', 'Gallery', 'Theater', 'Bowling', 'Arcade', 'Karaoke', 'Nightclub', 'Comedy Club']
  },
  travel: { 
    name: 'Travel & Tourism', 
    icon: '✈️',
    subcategories: ['Hotel', 'Motel', 'Hostel', 'Travel Agency', 'Tour Operator', 'Car Rental', 'Campground', 'Bed & Breakfast']
  },
};

export type CategoryKey = keyof typeof BUSINESS_CATEGORIES;
