// Canadian Cities with realistic data for business generation
export const CANADIAN_CITIES = {
  toronto: {
    name: "Toronto",
    province: "Ontario",
    neighborhoods: [
      "Downtown", "Yorkville", "Queen West", "King West", "Liberty Village",
      "Leslieville", "The Beaches", "Kensington Market", "Little Italy", "Chinatown",
      "Distillery District", "St. Lawrence Market", "Financial District", "Entertainment District",
      "Bloor West Village", "High Park", "Roncesvalles", "Danforth", "Greektown",
      "North York", "Scarborough", "Etobicoke", "Midtown", "Annex", "Cabbagetown",
      "Parkdale", "Junction", "Corso Italia", "Little Portugal", "Trinity Bellwoods"
    ],
    streets: [
      "King Street", "Queen Street", "Bloor Street", "Yonge Street", "Dundas Street",
      "College Street", "Spadina Avenue", "Bathurst Street", "Ossington Avenue", "Dufferin Street",
      "Bay Street", "University Avenue", "Front Street", "Wellington Street", "Richmond Street",
      "Adelaide Street", "Danforth Avenue", "St. Clair Avenue", "Eglinton Avenue", "Lawrence Avenue"
    ],
    postalPrefix: ["M5", "M4", "M6", "M2", "M3", "M1", "M8", "M9"],
    areaCode: "416",
    coordinates: { lat: 43.6532, lng: -79.3832 }
  },
  vancouver: {
    name: "Vancouver",
    province: "British Columbia",
    neighborhoods: [
      "Downtown", "Gastown", "Yaletown", "Kitsilano", "Commercial Drive",
      "Mount Pleasant", "Main Street", "Granville Island", "West End", "Coal Harbour",
      "Chinatown", "Strathcona", "East Vancouver", "South Granville", "Kerrisdale",
      "Dunbar", "Point Grey", "Fairview", "Olympic Village", "False Creek"
    ],
    streets: [
      "Robson Street", "Granville Street", "Davie Street", "Denman Street", "Commercial Drive",
      "Main Street", "Cambie Street", "Broadway", "4th Avenue", "Hastings Street",
      "Georgia Street", "Burrard Street", "Seymour Street", "Homer Street", "Richards Street"
    ],
    postalPrefix: ["V5", "V6", "V7"],
    areaCode: "604",
    coordinates: { lat: 49.2827, lng: -123.1207 }
  },
  calgary: {
    name: "Calgary",
    province: "Alberta",
    neighborhoods: [
      "Downtown", "Beltline", "Kensington", "Inglewood", "Mission",
      "Bridgeland", "Eau Claire", "Victoria Park", "Ramsay", "Hillhurst",
      "Sunnyside", "Marda Loop", "17th Avenue", "Stephen Avenue", "East Village"
    ],
    streets: [
      "17th Avenue", "Stephen Avenue", "1st Street", "Centre Street", "4th Street",
      "Macleod Trail", "Crowchild Trail", "14th Street", "Kensington Road", "Memorial Drive"
    ],
    postalPrefix: ["T2", "T3"],
    areaCode: "403",
    coordinates: { lat: 51.0447, lng: -114.0719 }
  },
  montreal: {
    name: "Montreal",
    province: "Quebec",
    neighborhoods: [
      "Old Montreal", "Downtown", "Plateau Mont-Royal", "Mile End", "Griffintown",
      "Little Italy", "Jean-Talon", "Outremont", "Westmount", "NDG",
      "Verdun", "Hochelaga", "Rosemont", "Villeray", "Saint-Henri",
      "Pointe-Saint-Charles", "Latin Quarter", "Gay Village", "Chinatown", "Old Port"
    ],
    streets: [
      "Rue Sainte-Catherine", "Boulevard Saint-Laurent", "Rue Saint-Denis", "Avenue du Mont-Royal",
      "Rue Sherbrooke", "Boulevard René-Lévesque", "Rue Notre-Dame", "Rue de la Commune",
      "Avenue Laurier", "Rue Rachel", "Rue Ontario", "Rue Wellington", "Rue Saint-Paul"
    ],
    postalPrefix: ["H2", "H3", "H4"],
    areaCode: "514",
    coordinates: { lat: 45.5017, lng: -73.5673 }
  },
  ottawa: {
    name: "Ottawa",
    province: "Ontario",
    neighborhoods: [
      "ByWard Market", "Downtown", "Centretown", "The Glebe", "Westboro",
      "Hintonburg", "Little Italy", "Chinatown", "Sandy Hill", "New Edinburgh",
      "Rockcliffe Park", "Old Ottawa South", "Lansdowne", "Wellington West", "Elgin Street"
    ],
    streets: [
      "Sparks Street", "Bank Street", "Elgin Street", "Rideau Street", "Wellington Street",
      "Sussex Drive", "Somerset Street", "Preston Street", "Richmond Road", "Dalhousie Street"
    ],
    postalPrefix: ["K1", "K2"],
    areaCode: "613",
    coordinates: { lat: 45.4215, lng: -75.6972 }
  },
  edmonton: {
    name: "Edmonton",
    province: "Alberta",
    neighborhoods: [
      "Downtown", "Old Strathcona", "Whyte Avenue", "Jasper Avenue", "Ice District",
      "Oliver", "Garneau", "Highlands", "Ritchie", "Bonnie Doon"
    ],
    streets: [
      "Whyte Avenue", "Jasper Avenue", "104th Street", "109th Street", "124th Street",
      "Stony Plain Road", "Gateway Boulevard", "Calgary Trail", "97th Street"
    ],
    postalPrefix: ["T5", "T6"],
    areaCode: "780",
    coordinates: { lat: 53.5461, lng: -113.4938 }
  },
  winnipeg: {
    name: "Winnipeg",
    province: "Manitoba",
    neighborhoods: [
      "Downtown", "Exchange District", "The Forks", "Osborne Village", "Corydon",
      "Wolseley", "River Heights", "St. Boniface", "West Broadway", "South Osborne"
    ],
    streets: [
      "Portage Avenue", "Main Street", "Corydon Avenue", "Osborne Street", "Broadway",
      "Pembina Highway", "Henderson Highway", "Notre Dame Avenue", "Provencher Boulevard"
    ],
    postalPrefix: ["R2", "R3"],
    areaCode: "204",
    coordinates: { lat: 49.8951, lng: -97.1384 }
  },
  hamilton: {
    name: "Hamilton",
    province: "Ontario",
    neighborhoods: [
      "Downtown", "James Street North", "Locke Street", "Westdale", "Dundas",
      "Ancaster", "Stoney Creek", "Concession Street", "Ottawa Street", "Barton Village"
    ],
    streets: [
      "James Street", "King Street", "Main Street", "Locke Street", "Barton Street",
      "Cannon Street", "York Boulevard", "Upper James Street", "Concession Street"
    ],
    postalPrefix: ["L8", "L9"],
    areaCode: "905",
    coordinates: { lat: 43.2557, lng: -79.8711 }
  },
  victoria: {
    name: "Victoria",
    province: "British Columbia",
    neighborhoods: [
      "Downtown", "Inner Harbour", "Chinatown", "James Bay", "Fernwood",
      "Oak Bay", "Fairfield", "Cook Street Village", "Rockland", "Vic West"
    ],
    streets: [
      "Government Street", "Douglas Street", "Fort Street", "Yates Street", "Johnson Street",
      "Wharf Street", "Blanshard Street", "Cook Street", "Pandora Avenue", "Fisgard Street"
    ],
    postalPrefix: ["V8"],
    areaCode: "250",
    coordinates: { lat: 48.4284, lng: -123.3656 }
  },
  halifax: {
    name: "Halifax",
    province: "Nova Scotia",
    neighborhoods: [
      "Downtown", "Waterfront", "North End", "South End", "Spring Garden",
      "Quinpool", "West End", "Dartmouth", "Bedford", "Clayton Park"
    ],
    streets: [
      "Spring Garden Road", "Barrington Street", "Argyle Street", "Hollis Street", "Brunswick Street",
      "Gottingen Street", "Quinpool Road", "Robie Street", "Oxford Street", "Lower Water Street"
    ],
    postalPrefix: ["B3"],
    areaCode: "902",
    coordinates: { lat: 44.6488, lng: -63.5752 }
  }
} as const;

// City distribution for 10,000 businesses
export const CITY_DISTRIBUTION = {
  toronto: 0.40,    // 4,000 businesses
  vancouver: 0.20,  // 2,000 businesses
  calgary: 0.10,    // 1,000 businesses
  montreal: 0.10,   // 1,000 businesses
  ottawa: 0.07,     // 700 businesses
  edmonton: 0.05,   // 500 businesses
  winnipeg: 0.03,   // 300 businesses
  hamilton: 0.02,   // 200 businesses
  victoria: 0.02,   // 200 businesses
  halifax: 0.01     // 100 businesses
} as const;

export type CityKey = keyof typeof CANADIAN_CITIES;
