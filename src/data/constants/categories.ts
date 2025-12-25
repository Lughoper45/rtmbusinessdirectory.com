// Business categories with subcategories and distribution
export const BUSINESS_CATEGORIES = {
  restaurants: {
    name: "Restaurants & Food",
    icon: "🍽️",
    distribution: 0.30, // 30% = 3,000 businesses
    subcategories: [
      { name: "Fine Dining", weight: 0.10 },
      { name: "Casual Dining", weight: 0.25 },
      { name: "Fast Food", weight: 0.15 },
      { name: "Cafes & Coffee Shops", weight: 0.20 },
      { name: "Bakeries & Desserts", weight: 0.10 },
      { name: "Bars & Pubs", weight: 0.10 },
      { name: "Food Trucks", weight: 0.05 },
      { name: "Catering", weight: 0.05 }
    ],
    cuisines: [
      "Italian", "Chinese", "Japanese", "Indian", "Thai", "Vietnamese", "Korean",
      "Mexican", "Greek", "French", "Mediterranean", "Middle Eastern", "Caribbean",
      "African", "Ethiopian", "Portuguese", "Spanish", "American", "Canadian",
      "Fusion", "Vegetarian", "Vegan", "Seafood", "Steakhouse", "Pizza", "Sushi",
      "Ramen", "Dim Sum", "BBQ", "Southern", "Peruvian", "Brazilian", "Turkish"
    ]
  },
  retail: {
    name: "Retail & Shopping",
    icon: "🛍️",
    distribution: 0.20, // 20% = 2,000 businesses
    subcategories: [
      { name: "Clothing & Fashion", weight: 0.25 },
      { name: "Electronics", weight: 0.15 },
      { name: "Home & Garden", weight: 0.15 },
      { name: "Grocery & Food Stores", weight: 0.15 },
      { name: "Specialty Shops", weight: 0.10 },
      { name: "Books & Media", weight: 0.05 },
      { name: "Sports & Outdoors", weight: 0.08 },
      { name: "Jewelry & Accessories", weight: 0.07 }
    ]
  },
  professional: {
    name: "Professional Services",
    icon: "💼",
    distribution: 0.15, // 15% = 1,500 businesses
    subcategories: [
      { name: "Legal Services", weight: 0.20 },
      { name: "Accounting & Tax", weight: 0.20 },
      { name: "Real Estate", weight: 0.15 },
      { name: "Insurance", weight: 0.10 },
      { name: "Financial Advisors", weight: 0.10 },
      { name: "Marketing & Advertising", weight: 0.10 },
      { name: "Consulting", weight: 0.10 },
      { name: "IT Services", weight: 0.05 }
    ]
  },
  health: {
    name: "Health & Wellness",
    icon: "💊",
    distribution: 0.12, // 12% = 1,200 businesses
    subcategories: [
      { name: "Medical Clinics", weight: 0.20 },
      { name: "Dental Clinics", weight: 0.15 },
      { name: "Pharmacies", weight: 0.15 },
      { name: "Fitness & Gyms", weight: 0.15 },
      { name: "Spa & Massage", weight: 0.10 },
      { name: "Mental Health", weight: 0.10 },
      { name: "Chiropractors", weight: 0.08 },
      { name: "Optometrists", weight: 0.07 }
    ]
  },
  homeServices: {
    name: "Home Services",
    icon: "🏠",
    distribution: 0.10, // 10% = 1,000 businesses
    subcategories: [
      { name: "Plumbing", weight: 0.20 },
      { name: "Electrical", weight: 0.15 },
      { name: "HVAC", weight: 0.15 },
      { name: "Cleaning Services", weight: 0.15 },
      { name: "Landscaping", weight: 0.10 },
      { name: "Renovation", weight: 0.10 },
      { name: "Moving Services", weight: 0.08 },
      { name: "Pest Control", weight: 0.07 }
    ]
  },
  entertainment: {
    name: "Entertainment & Recreation",
    icon: "🎭",
    distribution: 0.08, // 8% = 800 businesses
    subcategories: [
      { name: "Event Venues", weight: 0.20 },
      { name: "Nightclubs & Lounges", weight: 0.15 },
      { name: "Theatres & Cinemas", weight: 0.15 },
      { name: "Sports Facilities", weight: 0.15 },
      { name: "Museums & Galleries", weight: 0.10 },
      { name: "Arcades & Gaming", weight: 0.10 },
      { name: "Tours & Activities", weight: 0.10 },
      { name: "Parks & Recreation", weight: 0.05 }
    ]
  },
  beauty: {
    name: "Beauty & Personal Care",
    icon: "💇",
    distribution: 0.05, // 5% = 500 businesses
    subcategories: [
      { name: "Hair Salons", weight: 0.35 },
      { name: "Barber Shops", weight: 0.20 },
      { name: "Nail Salons", weight: 0.20 },
      { name: "Skin Care", weight: 0.15 },
      { name: "Tattoo & Piercing", weight: 0.10 }
    ]
  }
} as const;

// Category distribution for weighted selection
export const CATEGORY_DISTRIBUTION = Object.entries(BUSINESS_CATEGORIES).reduce(
  (acc, [key, value]) => ({ ...acc, [key]: value.distribution }),
  {} as Record<string, number>
);

export type CategoryKey = keyof typeof BUSINESS_CATEGORIES;
