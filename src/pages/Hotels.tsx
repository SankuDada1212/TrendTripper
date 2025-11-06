import { useState, useEffect } from "react";
import { Hotel, MapPin, Star, Filter, Calendar, Users, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getHotels, getHotelCities } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { saveHotel, bookHotel, deleteHotelBooking } from "@/lib/api";

const INDIAN_CITIES = ["Mumbai", "Pune", "Ahmedabad", "Surat", "Bangalore", "Chennai", "Kolkata", "Kanyakumari"];

const Hotels = () => {
  const { token, isAuthenticated, loadUserData } = useAuth();
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
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [bookingData, setBookingData] = useState({
    checkIn: "",
    checkOut: "",
    guests: 2,
    rooms: 1,
    guestName: "",
    guestEmail: "",
    guestPhone: "",
  });
  const [savedBookings, setSavedBookings] = useState<any[]>([]);

  // Load hotels on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load saved hotel bookings when auth changes
  useEffect(() => {
    const loadBookings = async () => {
      if (isAuthenticated && token) {
        try {
          const data = await loadUserData();
          console.log("Hotels - Loaded user data:", data);
          if (data && data.hotels) {
            const bookedHotels = data.hotels.filter((h: any) => h.action === "booked");
            setSavedBookings(bookedHotels);
            if (bookedHotels.length > 0) {
              toast.success(`Loaded ${bookedHotels.length} saved hotel booking(s)`);
            }
          } else {
            setSavedBookings([]);
          }
        } catch (err) {
          console.error("Failed to load saved hotels:", err);
          toast.error("Failed to load your hotel bookings. Please refresh the page.");
          setSavedBookings([]);
        }
      } else {
        setSavedBookings([]);
      }
    };
    loadBookings();
  }, [isAuthenticated, token]);

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

      // Don't auto-load hotels - user must click search
      // This prevents "not found" issue on initial load
      setLoading(false);
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError("Failed to load data. Please try again.");
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
      console.log("Hotels API response:", data);
      
      if (data && (data as any).hotels) {
        const hotelsList = (data as any).hotels;
        setHotels(hotelsList);
        if (hotelsList.length > 0) {
          toast.success(`Found ${hotelsList.length} hotels`);
        } else {
          toast.info("No hotels match your filters. Try adjusting search criteria.");
        }
      } else {
        // If no hotels key, try to get hotels from the response directly
        const hotelsList = Array.isArray(data) ? data : (data as any)?.hotel || [];
        if (hotelsList.length > 0) {
          setHotels(hotelsList);
          toast.success(`Found ${hotelsList.length} hotels`);
      } else {
        setHotels([]);
          toast.info("No hotels available. Click 'Search Hotels' to load.");
        }
      }
    } catch (err: any) {
      console.error("Error loading hotels:", err);
      setError(err?.message || "Failed to load hotels");
      toast.error("Failed to load hotels. Please try again.");
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
      ) : hotels.length === 0 && !error ? (
        <Card className="max-w-6xl mx-auto">
          <CardContent className="p-12 text-center">
            <p className="text-lg text-muted-foreground mb-4">No hotels found. Click "Search Hotels" to load available hotels.</p>
            <Button onClick={handleSearch} className="gradient-hero text-white">
              Search Hotels
            </Button>
          </CardContent>
        </Card>
      ) : hotels.length > 0 ? (
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
                    <Button 
                      className="w-full gradient-hero text-white"
                      onClick={() => {
                        setSelectedHotel(hotel);
                        setBookingDialogOpen(true);
                        // Save hotel view
                        if (isAuthenticated && token) {
                          saveHotel(token, {
                            hotel_id: hotel.id,
                            hotel_data: hotel,
                            action: "viewed"
                          }).catch((err) => {
                            console.error("Failed to save hotel view:", err);
                          });
                        }
                      }}
                    >
                      Book Now
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {/* Saved Hotel Bookings */}
      {isAuthenticated && savedBookings.length > 0 && (
        <Card className="mt-8 max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle>Your Hotel Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {savedBookings.map((booking, idx) => {
                const bookingInfo = booking.booking_data || {};
                const hotel = booking.hotel_data || {};
                const checkInDate = bookingInfo.checkIn ? new Date(bookingInfo.checkIn).toLocaleDateString() : "N/A";
                const checkOutDate = bookingInfo.checkOut ? new Date(bookingInfo.checkOut).toLocaleDateString() : "N/A";
                const bookingDate = bookingInfo.bookingDate ? new Date(bookingInfo.bookingDate).toLocaleDateString() : "N/A";
                
                return (
                  <Card key={idx} className="border hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-2">{hotel.name || "Hotel Booking"}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                            <MapPin className="w-3 h-3" />
                            {hotel.location || "Location"}
                          </p>
                          <div className="mt-3 space-y-2 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <p><strong>Check-in:</strong> {checkInDate}</p>
                              <p><strong>Check-out:</strong> {checkOutDate}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <p><strong>Guests:</strong> {bookingInfo.guests || "N/A"}</p>
                              <p><strong>Rooms:</strong> {bookingInfo.rooms || "N/A"}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <p><strong>Nights:</strong> {bookingInfo.nights || "N/A"}</p>
                              <p><strong>Total:</strong> ₹{bookingInfo.totalAmount?.toLocaleString('en-IN') || "N/A"}</p>
                            </div>
                            {bookingInfo.guestName && (
                              <p className="text-xs text-muted-foreground mt-2">
                                <strong>Guest:</strong> {bookingInfo.guestName} ({bookingInfo.guestEmail})
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              <strong>Booked on:</strong> {bookingDate}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <Badge className="bg-green-500 text-white">Booked</Badge>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to delete this booking for ${hotel.name}?`)) {
                                try {
                                  const hotelId = booking.hotel_id || bookingInfo.hotel_id || hotel.id;
                                  await deleteHotelBooking(token!, hotelId);
                                  toast.success("Hotel booking deleted successfully");
                                  // Reload bookings
                                  const data = await loadUserData();
                                  if (data && data.hotels) {
                                    const bookedHotels = data.hotels.filter((h: any) => h.action === "booked");
                                    setSavedBookings(bookedHotels);
                                  }
                                } catch (err: any) {
                                  console.error("Failed to delete booking:", err);
                                  toast.error(err.message || "Failed to delete booking. Please try again.");
                                }
                              }
                            }}
                            className="mt-2"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hotel Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book Hotel</DialogTitle>
            <DialogDescription>
              Complete your booking details for {selectedHotel?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedHotel && (
            <div className="space-y-6 mt-4">
              {/* Hotel Summary */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={selectedHotel.imageUrl || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"}
                      alt={selectedHotel.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{selectedHotel.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {selectedHotel.location}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{selectedHotel.rating}</span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-lg font-bold text-primary">
                          ₹{selectedHotel.price?.toLocaleString('en-IN')}/night
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Form */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkIn">Check-in Date *</Label>
                  <Input
                    id="checkIn"
                    type="date"
                    value={bookingData.checkIn}
                    onChange={(e) => {
                      setBookingData({ ...bookingData, checkIn: e.target.value });
                      // Auto-set check-out to next day if not set
                      if (!bookingData.checkOut && e.target.value) {
                        const nextDay = new Date(e.target.value);
                        nextDay.setDate(nextDay.getDate() + 1);
                        setBookingData({ 
                          ...bookingData, 
                          checkIn: e.target.value,
                          checkOut: nextDay.toISOString().split('T')[0]
                        });
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkOut">Check-out Date *</Label>
                  <Input
                    id="checkOut"
                    type="date"
                    value={bookingData.checkOut}
                    onChange={(e) => setBookingData({ ...bookingData, checkOut: e.target.value })}
                    min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guests">Number of Guests *</Label>
                  <Input
                    id="guests"
                    type="number"
                    min={1}
                    max={10}
                    value={bookingData.guests}
                    onChange={(e) => setBookingData({ ...bookingData, guests: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rooms">Number of Rooms *</Label>
                  <Input
                    id="rooms"
                    type="number"
                    min={1}
                    max={5}
                    value={bookingData.rooms}
                    onChange={(e) => setBookingData({ ...bookingData, rooms: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="guestName">Your Name *</Label>
                  <Input
                    id="guestName"
                    value={bookingData.guestName}
                    onChange={(e) => setBookingData({ ...bookingData, guestName: e.target.value })}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guestEmail">Email *</Label>
                  <Input
                    id="guestEmail"
                    type="email"
                    value={bookingData.guestEmail}
                    onChange={(e) => setBookingData({ ...bookingData, guestEmail: e.target.value })}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guestPhone">Phone Number *</Label>
                  <Input
                    id="guestPhone"
                    type="tel"
                    value={bookingData.guestPhone}
                    onChange={(e) => setBookingData({ ...bookingData, guestPhone: e.target.value })}
                    placeholder="+91 XXXXX XXXXX"
                    required
                  />
                </div>
              </div>

              {/* Price Calculation */}
              {bookingData.checkIn && bookingData.checkOut && (
                <Card className="bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Nights:</span>
                      <span className="font-semibold">
                        {Math.ceil(
                          (new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )} nights
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Room Rate:</span>
                      <span className="font-semibold">₹{selectedHotel.price?.toLocaleString('en-IN')}/night</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Rooms:</span>
                      <span className="font-semibold">{bookingData.rooms}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">Total Amount:</span>
                        <span className="font-bold text-xl text-primary">
                          ₹{(
                            selectedHotel.price *
                            bookingData.rooms *
                            Math.ceil(
                              (new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )
                          ).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBookingDialogOpen(false);
                    setSelectedHotel(null);
                    setBookingData({
                      checkIn: "",
                      checkOut: "",
                      guests: 2,
                      rooms: 1,
                      guestName: "",
                      guestEmail: "",
                      guestPhone: "",
                    });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 gradient-hero text-white"
                  onClick={async () => {
                    // Validate
                    if (!bookingData.checkIn || !bookingData.checkOut || !bookingData.guestName || !bookingData.guestEmail || !bookingData.guestPhone) {
                      toast.error("Please fill all required fields");
                      return;
                    }
                    
                    if (new Date(bookingData.checkIn) >= new Date(bookingData.checkOut)) {
                      toast.error("Check-out date must be after check-in date");
                      return;
                    }

                    if (!isAuthenticated || !token) {
                      toast.error("Please login to book hotels");
                      return;
                    }

                    const nights = Math.ceil(
                      (new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    const totalAmount = selectedHotel.price * bookingData.rooms * nights;

                    const bookingPayload = {
                      hotel_id: selectedHotel.id,
                      hotel_data: selectedHotel,
                      checkIn: bookingData.checkIn,
                      checkOut: bookingData.checkOut,
                      guests: bookingData.guests,
                      rooms: bookingData.rooms,
                      guestName: bookingData.guestName,
                      guestEmail: bookingData.guestEmail,
                      guestPhone: bookingData.guestPhone,
                      totalAmount,
                      nights,
                      bookingDate: new Date().toISOString(),
                    };

                    try {
                      await bookHotel(token, bookingPayload);
                      toast.success("Hotel booked successfully! Your booking has been saved.");
                      
                      // Reload bookings immediately
                      try {
                        const data = await loadUserData();
                        if (data && data.hotels) {
                          const bookedHotels = data.hotels.filter((h: any) => h.action === "booked");
                          setSavedBookings(bookedHotels);
                          console.log("Hotel bookings reloaded successfully");
                        }
                      } catch (reloadErr) {
                        console.error("Failed to reload bookings:", reloadErr);
                        // Still show success, data is saved
                      }
                      
                      // Clear form and close dialog
                      setBookingDialogOpen(false);
                      setSelectedHotel(null);
                      setBookingData({
                        checkIn: "",
                        checkOut: "",
                        guests: 2,
                        rooms: 1,
                        guestName: "",
                        guestEmail: "",
                        guestPhone: "",
                      });
                    } catch (error: any) {
                      console.error("Failed to book hotel:", error);
                      toast.error(error.message || "Failed to book hotel. Please try again.");
                    }
                  }}
                >
                  Confirm Booking
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Hotels;
