// Business name generators by category
export const BUSINESS_NAME_PARTS = {
  prefixes: [
    "The", "Royal", "Golden", "Silver", "Premier", "Elite", "Prime", "Grand",
    "Classic", "Modern", "Urban", "City", "Metro", "Downtown", "Village",
    "Maple", "Northern", "Canadian", "True", "Authentic", "Fresh", "Pure"
  ],
  restaurantNames: [
    "Kitchen", "Grill", "Bistro", "Café", "Eatery", "Table", "Plate", "Fork",
    "Spoon", "Tavern", "House", "Room", "Corner", "Place", "Spot", "Joint",
    "Den", "Lounge", "Bar", "Pub", "Brewery", "Cantina", "Trattoria", "Brasserie"
  ],
  retailNames: [
    "Shop", "Store", "Boutique", "Emporium", "Market", "Outlet", "Gallery",
    "Studio", "Collections", "Goods", "Supply", "Trading", "Mercantile"
  ],
  serviceNames: [
    "Group", "Associates", "Partners", "Solutions", "Services", "Consulting",
    "Advisors", "Professionals", "Experts", "Specialists", "Team", "Agency"
  ],
  healthNames: [
    "Clinic", "Centre", "Wellness", "Health", "Care", "Medical", "Therapy",
    "Healing", "Recovery", "Vitality", "Balance", "Harmony", "Life"
  ],
  homeServiceNames: [
    "Pro", "Services", "Solutions", "Experts", "Masters", "Team", "Crew",
    "Brothers", "& Sons", "& Co", "Contractors", "Specialists"
  ],
  firstNames: [
    "James", "Michael", "David", "John", "Robert", "William", "Richard", "Joseph",
    "Thomas", "Charles", "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth",
    "Barbara", "Susan", "Jessica", "Sarah", "Karen", "Marco", "Giovanni", "Yuki",
    "Chen", "Raj", "Ahmed", "Sophie", "Emma", "Olivia", "Liam", "Noah", "Ethan"
  ],
  lastNames: [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Anderson", "Taylor", "Thomas", "Moore", "Jackson",
    "Lee", "Kim", "Wong", "Chen", "Patel", "Singh", "Nguyen", "Rossi", "Müller"
  ]
};

// Features by category
export const CATEGORY_FEATURES: Record<string, string[]> = {
  restaurants: [
    "Dine-in", "Takeout", "Delivery", "Outdoor Seating", "Private Dining",
    "Reservations", "Catering", "Full Bar", "Happy Hour", "Live Music",
    "Free WiFi", "Parking Available", "Wheelchair Accessible", "Kid-Friendly",
    "Pet-Friendly Patio", "Vegan Options", "Gluten-Free Options", "Halal",
    "Kosher", "Late Night", "Brunch", "Group Friendly"
  ],
  retail: [
    "In-Store Shopping", "Curbside Pickup", "Delivery", "Online Shopping",
    "Gift Wrapping", "Personal Shopping", "Alterations", "Price Matching",
    "Loyalty Program", "Free Parking", "Wheelchair Accessible", "Gift Cards"
  ],
  professional: [
    "Free Consultation", "Virtual Meetings", "Home Visits", "24/7 Service",
    "Multilingual Staff", "Evening Hours", "Weekend Hours", "Free Parking",
    "Wheelchair Accessible", "Online Booking", "Payment Plans"
  ],
  health: [
    "Walk-ins Welcome", "Online Booking", "Virtual Consultations", "Evening Hours",
    "Weekend Hours", "Insurance Accepted", "Direct Billing", "Parking Available",
    "Wheelchair Accessible", "Multilingual Staff", "Same-Day Appointments"
  ],
  homeServices: [
    "Free Estimates", "24/7 Emergency", "Licensed & Insured", "Warranty Included",
    "Senior Discount", "Eco-Friendly", "Weekend Service", "Same-Day Service",
    "Online Booking", "Financing Available"
  ],
  entertainment: [
    "Private Events", "Group Bookings", "Online Tickets", "Accessibility",
    "Parking Available", "Food & Drinks", "VIP Options", "Gift Cards",
    "Membership Available", "Kid-Friendly"
  ],
  beauty: [
    "Walk-ins Welcome", "Online Booking", "Evening Hours", "Weekend Hours",
    "Parking Available", "Wheelchair Accessible", "Products for Sale",
    "Gift Cards", "Loyalty Program", "Bridal Services"
  ]
};

// Ownership types with realistic distribution
export const OWNERSHIP_TYPES = [
  { name: "Canadian-Owned", icon: "🇨🇦", weight: 0.70 },
  { name: "Women-Owned", icon: "👩", weight: 0.30 },
  { name: "Immigrant-Owned", icon: "🌍", weight: 0.25 },
  { name: "Family-Owned", icon: "👨‍👩‍👧", weight: 0.40 },
  { name: "Indigenous-Owned", icon: "🪶", weight: 0.03 },
  { name: "LGBTQ+-Owned", icon: "🏳️‍🌈", weight: 0.05 },
  { name: "Veteran-Owned", icon: "🎖️", weight: 0.02 },
  { name: "Black-Owned", icon: "✊", weight: 0.08 }
];

// Review templates for generating realistic reviews
export const REVIEW_TEMPLATES = {
  positive: [
    "Absolutely amazing experience! {specific} Will definitely be back!",
    "Best {category} in {city}! {specific} Highly recommend.",
    "Exceeded all expectations. {specific} 5 stars all the way!",
    "Hidden gem! {specific} Don't miss this place.",
    "Outstanding service and quality. {specific} A must-visit!",
    "Fantastic! {specific} Already planning my next visit.",
    "Top-notch {category}. {specific} Worth every penny.",
    "Incredible! {specific} My new favorite spot in {neighborhood}.",
    "World-class experience. {specific} Can't say enough good things.",
    "Blown away by the quality. {specific} Telling all my friends!"
  ],
  neutral: [
    "Good overall experience. {specific} Might return.",
    "Decent {category}. {specific} Nothing extraordinary but solid.",
    "Pretty good! {specific} A few things could be improved.",
    "Nice place. {specific} Fair prices for what you get.",
    "Satisfied with my visit. {specific} Would recommend to others."
  ],
  specifics: {
    restaurants: [
      "The food was incredible and portions were generous.",
      "Amazing atmosphere and friendly staff.",
      "Fresh ingredients and authentic flavors.",
      "Quick service even during busy hours.",
      "Beautiful presentation and delicious taste.",
      "The chef really knows what they're doing!",
      "Perfect for date night or special occasions."
    ],
    retail: [
      "Great selection and helpful staff.",
      "Found exactly what I was looking for.",
      "Quality products at reasonable prices.",
      "Knowledgeable employees who really helped.",
      "Clean store with easy navigation."
    ],
    professional: [
      "Very professional and thorough.",
      "Explained everything clearly.",
      "Responsive and easy to work with.",
      "Saved me time and money.",
      "Exceeded my expectations completely."
    ],
    health: [
      "Caring staff and clean facility.",
      "Short wait times and thorough care.",
      "Really listened to my concerns.",
      "Modern equipment and comfortable environment.",
      "Follow-up care was excellent."
    ],
    homeServices: [
      "On time and professional.",
      "Fair pricing with no surprises.",
      "Quality work that lasted.",
      "Left everything clean and tidy.",
      "Went above and beyond expectations."
    ],
    entertainment: [
      "Amazing show and great venue.",
      "Perfect for groups and parties.",
      "Fun for the whole family.",
      "Great atmosphere and energy.",
      "Worth the ticket price!"
    ],
    beauty: [
      "Love my new look!",
      "Relaxing experience from start to finish.",
      "Talented stylists who listen.",
      "Clean and modern salon.",
      "Best service I've ever had!"
    ]
  },
  reviewerNames: [
    "Sarah M.", "John D.", "Emily R.", "Michael T.", "Jessica L.",
    "David K.", "Amanda S.", "Chris W.", "Rachel B.", "Kevin H.",
    "Lisa P.", "Brian C.", "Nicole F.", "Jason M.", "Ashley G.",
    "Ryan T.", "Stephanie V.", "Mark L.", "Lauren N.", "Andrew J."
  ]
};

// World Cup 2026 specific attributes
export const WORLD_CUP_FEATURES = [
  "Multilingual Staff", "Extended Hours", "Big Screen TVs",
  "Fan Zone", "Special Match Day Menu", "Group Seating",
  "International Payment Methods", "Tourist Friendly",
  "Walking Distance to Transit", "Late Night Service"
];
