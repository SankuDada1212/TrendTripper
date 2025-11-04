import { useState, useEffect } from "react";
import { Hotel, MapPin, Star, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { getHotels, getHotelCities } from "@/lib/api";

const INDIAN_CITIES = ["Mumbai", "Pune", "Ahmedabad", "Surat", "Bangalore", "Chennai", "Kolkata", "Kanyakumari"];

const Hotels = () => {
  const [hotels, setHotels] = useState<any[]>([]);
  const [cities, setCities] = useState<string[]>(INDIAN_CITIES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [filters, setFilters] = useState({
    location: "all",
    hotel_type: "all",
    min_price: 0,
    max_price: 20000,
    min_rating: 0,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Load hotels on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Load cities
      try {
        const citiesData = await getHotelCities();
        if (citiesData && (citiesData as any).cities) {
          setCities((citiesData as any).cities);
        }
      } catch (err) {
        console.log("Using default cities");
      }

      // Load hotels
      await loadHotels();
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError("Failed to load hotels. Please try again.");
      setLoading(false);
    }
  };

  const loadHotels = async () => {
    setLoading(true);
    setError("");
    
    try {
      const params: any = {};
      if (filters.location && filters.location !== "all") params.location = filters.location;
      if (filters.hotel_type !== "all") params.hotel_type = filters.hotel_type;
      if (filters.min_price > 0) params.min_price = filters.min_price;
      if (filters.max_price < 20000) params.max_price = filters.max_price;
      if (filters.min_rating > 0) params.min_rating = filters.min_rating;

      const data = await getHotels(params);
      
      if (data && (data as any).hotels) {
        const hotelsList = (data as any).hotels;
        setHotels(hotelsList);
        if (hotelsList.length > 0) {
          toast.success(`Found ${hotelsList.length} hotels`);
        } else {
          toast.info("No hotels found. Try adjusting filters.");
        }
      } else {
        setHotels([]);
        toast.info("No hotels available");
      }
    } catch (err: any) {
      console.error("Error loading hotels:", err);
      setError(err?.message || "Failed to load hotels");
      toast.error("Failed to load hotels");
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadHotels();
  };

  const getTypeColor = (type: string) => {
    if (type === "luxury") return "bg-purple-500";
    if (type === "mid-range") return "bg-blue-500";
    if (type === "budget") return "bg-green-500";
    return "bg-gray-500";
  };

  const amenityIcons: Record<string, string> = {
    Pool: "🏊",
    Spa: "💆",
    "Beach Access": "🏖️",
    Restaurant: "🍽️",
    Gym: "💪",
    Concierge: "🔔",
    "Business Center": "💼",
    WiFi: "📶",
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 gradient-hero rounded-2xl mb-4">
          <Hotel className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Find Hotels in India</h1>
        <p className="text-xl text-muted-foreground">
          Discover amazing hotels across India's finest cities
        </p>
      </div>

      {/* Search Card */}
      <Card className="mb-8 max-w-6xl mx-auto">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Select City</Label>
              <Select
                value={filters.location}
                onValueChange={(value) => setFilters({ ...filters, location: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Hotel Type</Label>
              <Select
                value={filters.hotel_type}
                onValueChange={(value) => setFilters({ ...filters, hotel_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="mid-range">Mid-Range</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
              className="mb-4"
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? "Hide" : "Show"} More Filters
            </Button>

            {showFilters && (
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Price: ₹{filters.min_price.toLocaleString('en-IN')} - ₹{filters.max_price.toLocaleString('en-IN')}</Label>
                  <Slider
                    value={[filters.min_price, filters.max_price]}
                    onValueChange={(vals) =>
                      setFilters({ ...filters, min_price: vals[0], max_price: vals[1] })
                    }
                    max={20000}
                    min={0}
                    step={500}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Min Rating: {filters.min_rating}+ ⭐</Label>
                  <Slider
                    value={[filters.min_rating]}
                    onValueChange={(vals) => setFilters({ ...filters, min_rating: vals[0] })}
                    max={5}
                    min={0}
                    step={0.5}
                  />
                </div>
              </div>
            )}

            <Button onClick={handleSearch} className="w-full gradient-hero text-white" disabled={loading}>
              {loading ? "Searching..." : "Search Hotels"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="mb-8 border-red-500 max-w-6xl mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadHotels} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Hotels Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading hotels...</p>
          </div>
        </div>
      ) : hotels.length === 0 ? (
        <Card className="max-w-6xl mx-auto">
          <CardContent className="p-12 text-center">
            <p className="text-lg text-muted-foreground mb-4">No hotels found</p>
            <Button onClick={handleSearch} variant="outline">
              Try Different Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {hotels.map((hotel) => (
            <Card key={hotel.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="grid md:grid-cols-2 gap-4 p-6">
                {/* Image */}
                <div className="relative h-48 md:h-full rounded-lg overflow-hidden">
                  <img
                    src={hotel.imageUrl || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"}
                    alt={hotel.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800";
                    }}
                  />
                  <div className="absolute top-2 right-2 flex flex-col gap-2">
                    <Badge className="bg-white text-black">
                      <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                      {hotel.rating}
                    </Badge>
                    {hotel.type && (
                      <Badge className={`${getTypeColor(hotel.type)} text-white`}>
                        {hotel.type.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{hotel.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <MapPin className="w-4 h-4" />
                      <span>{hotel.location}</span>
                    </div>

                    {hotel.amenities && hotel.amenities.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold mb-2">Amenities:</p>
                        <div className="flex flex-wrap gap-2">
                          {hotel.amenities.slice(0, 4).map((amenity: string) => (
                            <Badge key={amenity} variant="secondary" className="text-xs">
                              {amenityIcons[amenity] || "✓"} {amenity}
                            </Badge>
                          ))}
                          {hotel.amenities.length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{hotel.amenities.length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">Starting from</p>
                      <p className="text-3xl font-bold text-primary">
                        ₹{typeof hotel.price === 'number' ? hotel.price.toLocaleString('en-IN') : hotel.price || '0'}
                        <span className="text-sm font-normal text-muted-foreground">/night</span>
                      </p>
                    </div>
                    <Button className="w-full gradient-hero text-white">
                      Book Now
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Hotels;
