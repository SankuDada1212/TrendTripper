// Mock data for demo purposes

export const mockMonuments = [
  {
    id: 1,
    name: "Taj Mahal",
    location: "Agra, India",
    description: "An ivory-white marble mausoleum on the right bank of the river Yamuna",
    yearBuilt: 1653,
    imageUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800",
    oldImageUrl: "https://images.unsplash.com/photo-1548013146-72479768bada?w=800",
    timeline: ["1632: Construction began", "1643: Main building completed", "1653: Complex finished"],
  },
  {
    id: 2,
    name: "Eiffel Tower",
    location: "Paris, France",
    description: "A wrought-iron lattice tower on the Champ de Mars",
    yearBuilt: 1889,
    imageUrl: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800",
    oldImageUrl: "https://images.unsplash.com/photo-1543255243-d0f8b7d3e6e8?w=800",
    timeline: ["1887: Construction started", "1889: Opened for World's Fair", "1889: Became symbol of Paris"],
  },
  {
    id: 3,
    name: "Colosseum",
    location: "Rome, Italy",
    description: "An oval amphitheatre in the centre of the city of Rome",
    yearBuilt: 80,
    imageUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800",
    oldImageUrl: "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800",
    timeline: ["70 AD: Construction began", "80 AD: Inaugurated by Titus", "80 AD: 100-day games held"],
  },
];

export const mockMoodRecommendations = {
  adventurous: [
    {
      id: 1,
      name: "Mountain Peak Cafe",
      type: "food",
      description: "Authentic mountain cuisine with breathtaking views",
      rating: 4.8,
      imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
    },
    {
      id: 2,
      name: "Zip Line Adventure Park",
      type: "activity",
      description: "Thrilling zip-line experience through forest canopy",
      rating: 4.9,
      imageUrl: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=800",
    },
  ],
  relaxed: [
    {
      id: 3,
      name: "Zen Garden Tea House",
      type: "food",
      description: "Peaceful ambiance with organic tea selection",
      rating: 4.7,
      imageUrl: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800",
    },
    {
      id: 4,
      name: "Sunset Beach Yoga",
      type: "activity",
      description: "Relaxing yoga sessions by the ocean",
      rating: 4.8,
      imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
    },
  ],
};

export const mockEvents = [
  {
    id: 1,
    name: "Summer Music Festival",
    date: "2024-07-15",
    location: "Central Park",
    description: "Three-day music festival featuring top artists",
    price: 150,
    imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800",
    category: "Music",
  },
  {
    id: 2,
    name: "Food & Wine Expo",
    date: "2024-06-20",
    location: "Convention Center",
    description: "Taste cuisines from around the world",
    price: 45,
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
    category: "Food",
  },
  {
    id: 3,
    name: "Art Gallery Opening",
    date: "2024-06-10",
    location: "Downtown Gallery",
    description: "Contemporary art exhibition opening night",
    price: 20,
    imageUrl: "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800",
    category: "Art",
  },
];

export const mockHotels = [
  {
    id: 1,
    name: "Grand Ocean Resort",
    location: "Miami Beach, FL",
    rating: 4.8,
    price: 299,
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
    amenities: ["Pool", "Spa", "Beach Access", "Restaurant"],
  },
  {
    id: 2,
    name: "Mountain View Lodge",
    location: "Aspen, CO",
    rating: 4.9,
    price: 450,
    imageUrl: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
    amenities: ["Ski-in/Ski-out", "Fireplace", "Hot Tub", "Restaurant"],
  },
  {
    id: 3,
    name: "Downtown Boutique Hotel",
    location: "New York, NY",
    rating: 4.6,
    price: 350,
    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
    amenities: ["Rooftop Bar", "Gym", "Concierge", "Business Center"],
  },
];

export const mockTravelOptions = {
  flights: [
    {
      id: 1,
      airline: "SkyHigh Airways",
      departure: "10:30 AM",
      arrival: "2:45 PM",
      duration: "4h 15m",
      price: 250,
      stops: 0,
    },
    {
      id: 2,
      airline: "Cloud Nine",
      departure: "2:00 PM",
      arrival: "8:30 PM",
      duration: "6h 30m",
      price: 180,
      stops: 1,
    },
  ],
  trains: [
    {
      id: 1,
      service: "Express Rail",
      departure: "8:00 AM",
      arrival: "4:30 PM",
      duration: "8h 30m",
      price: 95,
      class: "First Class",
    },
    {
      id: 2,
      service: "Rapid Transit",
      departure: "11:00 AM",
      arrival: "8:00 PM",
      duration: "9h",
      price: 65,
      class: "Standard",
    },
  ],
  cabs: [
    {
      id: 1,
      service: "Premium Ride",
      type: "Sedan",
      price: 120,
      duration: "5h",
      features: ["AC", "WiFi", "Bottled Water"],
    },
    {
      id: 2,
      service: "Comfort Cab",
      type: "SUV",
      price: 180,
      duration: "5h",
      features: ["AC", "WiFi", "Spacious", "Luggage Space"],
    },
  ],
};
