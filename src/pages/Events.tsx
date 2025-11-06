import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, MapPin, IndianRupee, Filter, Plus, Download, Image as ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getEvents } from "@/lib/api";
import { mockEvents } from "@/lib/mockData";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { saveEvent, deleteEventFromItinerary } from "@/lib/api";

// Artist image mapping - using Unsplash for artist photos
const getArtistImage = (artistName: string): string => {
  if (!artistName) return "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800";
  
  const normalizedName = artistName.toLowerCase().trim();
  
  // Map artist names to image URLs (using Unsplash search)
  const artistImageMap: Record<string, string> = {
    "abhijeet bhattacharya": "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800",
    "abhishek upmanyu": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "adnan sami": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "akon": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "amit kumar": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "ammy virk": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "ap dhillon": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "asees kaur": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "ar rahman": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "calvin harris": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "dj chetas": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "enrique iglesias": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "gurdas maan": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "gulzar": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "hariharan": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "harshdeep kaur": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "ilaiyaraaja": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "javed ali": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "john mayer": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "jubin nautiyal": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "kailash kher": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "ks chitra": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "kumar sanu": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "lucky ali": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "mithoon sharma": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "mohammed irfan": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "mohammad danish": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "palak muchhal": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "papon": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "piyush mishra": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "post malone": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "rahul deshpande": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "radhika das": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "rahat fateh ali khan": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "ram miriyala": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "rekha bharadwaj": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "rekha bhardwaj": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "roop kumar rathod": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "sajjan raj vaidya": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "salman ali": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "samay raina": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "satinder sartaaj": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "shaan": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "shilpa rao": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "shweta mohan": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "sid sriram": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "sonu nigam": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "sunburn festival": "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800",
    "sunidhi chauhan": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "travis scott": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "usha uthup": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "vishal bhardwaj": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    "zakir khan": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
  };

  // Try exact match first
  if (artistImageMap[normalizedName]) {
    return artistImageMap[normalizedName];
  }

  // Try partial match
  for (const [key, url] of Object.entries(artistImageMap)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return url;
    }
  }

  // Fallback to generic music/concert image
  return "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800";
};

const Events = () => {
  const { token, isAuthenticated, loadUserData } = useAuth();
  const [events, setEvents] = useState<any[]>(mockEvents);
  const [loading, setLoading] = useState(false);
  const [loadInfo, setLoadInfo] = useState<string>("Using mock events (fallback)");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [itinerary, setItinerary] = useState<any[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const categories = ["All", "Music", "Food", "Art", "Sports", "Culture"];

  const moodMap: Record<string, string[]> = {
    party: ["Music"],
    romantic: ["Art", "Food"],
    chill: ["Art", "Culture"],
    cultural: ["Culture", "Art"],
    indie: ["Art"],
    comedy: ["Culture"],
    family: ["Culture", "Food"],
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Load saved itinerary when auth changes
  useEffect(() => {
    const loadItinerary = async () => {
      if (isAuthenticated && token) {
        try {
          const data = await loadUserData();
          console.log("Events - Loaded user data:", data);
          if (data && data.events) {
            // Load events that were added to itinerary
            const itineraryEvents = data.events
              .filter((e: any) => e.action === "added_to_itinerary")
              .map((e: any) => e.event_data)
              .filter((e: any) => e); // Remove null/undefined
            if (itineraryEvents.length > 0) {
              setItinerary(itineraryEvents);
              toast.success(`Loaded ${itineraryEvents.length} saved event(s) from your itinerary`);
            }
          }
        } catch (err) {
          console.error("Failed to load saved events:", err);
        }
      }
    };
    loadItinerary();
  }, [isAuthenticated, token]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      console.log("Fetching events from API...");
      const data: any = await getEvents();
      console.log("Events API response:", data);
      const list = Array.isArray(data?.events) ? data.events : [];
      if (list.length === 0) {
        // Fallback to mock data if CSV empty or missing
        setEvents(mockEvents);
        setLoadInfo(data?.status === "file_not_found" 
          ? "CSV file not found. Showing mock events." 
          : "No CSV events found. Showing mock events.");
      } else {
        setEvents(list);
        setLoadInfo(`Loaded ${list.length} events from CSV`);
        toast.success(`Loaded ${list.length} events`);
      }
    } catch (error: any) {
      console.error("Error loading events:", error);
      toast.error(error?.message || "Failed to load events. Check if backend is running.");
      // Fallback on error
      setEvents(mockEvents);
      setLoadInfo("Error loading CSV. Showing mock events.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to normalize date to YYYY-MM-DD format
  const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return "";
    try {
      // Handle different date formats
      let date: Date;
      
      // If already in YYYY-MM-DD format, use it directly
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        date = new Date(dateStr + 'T00:00:00');
      } else {
        // Try parsing as-is
        date = new Date(dateStr);
      }
      
      if (isNaN(date.getTime())) {
        // Try parsing with common formats
        const parts = dateStr.split(/[/-]/);
        if (parts.length === 3) {
          // Try MM/DD/YYYY or DD/MM/YYYY
          date = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
          if (isNaN(date.getTime())) {
            date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        }
      }
      
      if (isNaN(date.getTime())) return "";
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  const filteredEvents = useMemo(() => {
    let filtered = [...events];
    
    console.log("=== FILTERING START ===");
    console.log("Total events:", events.length);
    console.log("Filters:", { searchQuery, selectedCategory, startDate, endDate });
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const beforeCount = filtered.length;
      filtered = filtered.filter((e: any) => {
        const nameMatch = e.name?.toLowerCase().includes(query) || false;
        const locationMatch = e.location?.toLowerCase().includes(query) || false;
        const artistMatch = e.artist?.toLowerCase().includes(query) || false;
        return nameMatch || locationMatch || artistMatch;
      });
      console.log(`Search filter: ${beforeCount} -> ${filtered.length}`);
    }
    
    // Filter by category
    if (selectedCategory && selectedCategory !== "All") {
      const beforeCount = filtered.length;
      filtered = filtered.filter((e: any) => e.category === selectedCategory);
      console.log(`Category filter (${selectedCategory}): ${beforeCount} -> ${filtered.length}`);
    }
    
    // Filter by date range
    if (startDate?.trim() || endDate?.trim()) {
      const beforeCount = filtered.length;
      const start = startDate?.trim() || null;
      const end = endDate?.trim() || null;
      
      console.log(`Applying date filter: start=${start}, end=${end}`);
      
      filtered = filtered.filter((e: any) => {
        if (!e.date || !String(e.date).trim()) {
          console.log(`Event "${e.name}" has no date, excluding`);
          return false; // Exclude events without dates
        }
        
        const eventDateStr = normalizeDate(String(e.date));
        if (!eventDateStr) {
          console.log(`Event "${e.name}" has invalid date: "${e.date}", excluding`);
          return false; // Exclude events with invalid dates
        }
        
        // Compare dates
        let matches = false;
        if (start && end) {
          // Both dates: event must be in range (inclusive)
          matches = eventDateStr >= start && eventDateStr <= end;
          if (!matches) {
            console.log(`Event "${e.name}": ${eventDateStr} NOT in range [${start}, ${end}]`);
          }
        } else if (start) {
          // Only start date: event must be on or after
          matches = eventDateStr >= start;
          if (!matches) {
            console.log(`Event "${e.name}": ${eventDateStr} is before ${start}`);
          }
        } else if (end) {
          // Only end date: event must be on or before
          matches = eventDateStr <= end;
          if (!matches) {
            console.log(`Event "${e.name}": ${eventDateStr} is after ${end}`);
          }
        }
        
        return matches;
      });
      console.log(`Date filter: ${beforeCount} -> ${filtered.length}`);
    }
    
    console.log("=== FILTERING END ===");
    console.log("Final filtered count:", filtered.length);
    
    return filtered;
  }, [events, searchQuery, selectedCategory, startDate, endDate]);

  const parseInput = (text: string) => {
    const lower = text.toLowerCase();
    const cities = ["delhi","mumbai","pune","goa","jaipur","ahmedabad","hyderabad","bengaluru","kolkata","chennai"];
    let mood: keyof typeof moodMap | undefined;
    for (const m of Object.keys(moodMap)) {
      if (lower.includes(m)) { mood = m as keyof typeof moodMap; break; }
    }
    let city: string | undefined;
    for (const c of cities) { if (lower.includes(c)) { city = c; break; } }
    return { city, mood };
  };

  const handleFind = () => {
    // Validate dates if both are selected
    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        toast.error("Start date must be before or equal to end date");
        return;
      }
    }
    
    if (!userInput.trim() && !startDate && !endDate) {
      toast.info("Enter a mood/city or select dates");
      return;
    }
    
    const { city, mood } = parseInput(userInput);
    setSearchQuery(city || "");
    if (mood) {
      const cats = moodMap[mood];
      if (cats && cats.length > 0) setSelectedCategory(cats[0]);
    }
    
    // Show success message if dates are selected
    if (startDate || endDate) {
      const dateRange = startDate && endDate 
        ? `${startDate} to ${endDate}`
        : startDate 
        ? `from ${startDate}`
        : `until ${endDate}`;
      toast.success(`Filtering events ${dateRange}`);
    }
  };

  const addToItinerary = (ev: any) => {
    setItinerary((prev) => {
      if (prev.some((p) => p.name === ev.name)) {
        toast.info("Already in your trip");
        return prev;
      }
      const newItinerary = [...prev, ev];
      toast.success(`Added ${ev.name} to your itinerary`);
      
      // Save event to backend if authenticated
      if (isAuthenticated && token) {
        saveEvent(token, {
          event_id: ev.id || ev.name,
          event_data: ev,
          action: "added_to_itinerary"
        }).then(() => {
          console.log("Event added to itinerary and saved");
        }).catch((err) => {
          console.error("Failed to save event:", err);
          toast.error("Failed to save. Please try again.");
        });
      }
      
      return newItinerary;
    });
  };

  const removeFromItinerary = async (ev: any) => {
    const eventId = ev.id || ev.name;
    setItinerary((prev) => prev.filter((e) => (e.id || e.name) !== eventId));
    
    // Delete from backend if authenticated
    if (isAuthenticated && token) {
      try {
        await deleteEventFromItinerary(token, eventId);
        toast.success(`Removed ${ev.name} from your itinerary`);
      } catch (err: any) {
        console.error("Failed to delete event:", err);
        toast.error("Failed to remove event. Please try again.");
        // Reload itinerary on error
        const data = await loadUserData();
        if (data && data.events) {
          const itineraryEvents = data.events
            .filter((e: any) => e.action === "added_to_itinerary")
            .map((e: any) => e.event_data)
            .filter((e: any) => e);
          setItinerary(itineraryEvents);
        }
      }
    } else {
      toast.success(`Removed ${ev.name} from your itinerary`);
    }
  };
  
  const handleEventView = (ev: any) => {
    // Save event view to backend if authenticated
    if (isAuthenticated && token) {
      saveEvent(token, {
        event_id: ev.id || ev.name,
        event_data: ev,
        action: "viewed"
      }).catch((err) => {
        console.error("Failed to save event view:", err);
      });
    }
  };

  const downloadCsv = () => {
    if (itinerary.length === 0) return;
    const header = "artist,name,city,date\n";
    const rows = itinerary.map((e) => `,${e.name},${e.location},${new Date(e.date).toISOString()}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trip_itinerary.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadIcs = () => {
    if (itinerary.length === 0) return;
    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\n";
    for (const e of itinerary) {
      const dt = new Date(e.date);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, "0");
      const d = String(dt.getDate()).padStart(2, "0");
      const hh = String(dt.getHours()).padStart(2, "0");
      const mm = String(dt.getMinutes()).padStart(2, "0");
      const ss = String(dt.getSeconds()).padStart(2, "0");
      ics += `BEGIN:VEVENT\nSUMMARY:${e.name}\nDTSTART:${y}${m}${d}T${hh}${mm}${ss}\nLOCATION:${e.location}\nEND:VEVENT\n`;
    }
    ics += "END:VCALENDAR";
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trip_calendar.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateMoodboard = async () => {
    if (itinerary.length === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = 800; canvas.height = 500;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff8f0";
    ctx.fillRect(0,0,800,500);
    ctx.fillStyle = "#1e1e1e";
    ctx.font = "20px ui-sans-serif";
    ctx.fillText("🧡 Your Trip Moodboard", 30, 40);
    let y = 80;
    for (const e of itinerary.slice(0, 6)) {
      ctx.fillText(`${e.name} (${e.location})`, 30, y);
      y += 50;
    }
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "trip_moodboard.png";
    a.click();
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 gradient-ocean rounded-2xl mb-4">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Upcoming Events</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover exciting events and experiences happening near you
        </p>
        <div className="text-sm text-muted-foreground mt-2">
          {loadInfo} • Showing {filteredEvents.length} of {events.length} events
          {(startDate || endDate || searchQuery || selectedCategory) && (
            <span className="ml-2 text-primary">(Filtered)</span>
          )}
        </div>
        <div className="mt-2">
          <Button variant="outline" size="sm" onClick={fetchEvents}>Reload Events</Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-5xl mx-auto mb-12 space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <Input
            type="text"
            placeholder="Describe what you want (e.g., 'chill in Pune next weekend')"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="md:col-span-2"
          />
          <Button onClick={handleFind} className="w-full">
            Find Events
          </Button>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Start Date</Label>
            <Input 
              type="date" 
              value={startDate} 
              onChange={(e)=> {
                const newStart = e.target.value;
                // Validate: if end date is set and new start > end, show error
                if (newStart && endDate && newStart > endDate) {
                  toast.error("Start date cannot be after end date");
                  setStartDate("");
                  return;
                }
                setStartDate(newStart);
                if (newStart) {
                  console.log("Start date set:", newStart);
                }
              }}
              min={new Date().toISOString().split('T')[0]} // Prevent past dates
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">End Date</Label>
            <Input 
              type="date" 
              value={endDate} 
              onChange={(e)=> {
                const newEnd = e.target.value;
                // Validate: if start date is set and start > new end, show error
                if (startDate && newEnd && startDate > newEnd) {
                  toast.error("End date cannot be before start date");
                  setEndDate("");
                  return;
                }
                setEndDate(newEnd);
                if (newEnd) {
                  console.log("End date set:", newEnd);
                }
              }}
              min={startDate || new Date().toISOString().split('T')[0]} // Must be after start date
            />
          </div>
          <div className="md:col-span-2">
            <Label className="text-sm font-medium mb-2 block">Search</Label>
            <Input
              type="text"
              placeholder="Search events, locations, or artists..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                console.log("Search query:", e.target.value);
              }}
            />
          </div>
        </div>
        
        {(startDate || endDate) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Filtering by date:</span>
            {startDate && <span className="font-semibold">From {new Date(startDate).toLocaleDateString()}</span>}
            {endDate && <span className="font-semibold">Until {new Date(endDate).toLocaleDateString()}</span>}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setStartDate("");
                setEndDate("");
                console.log("Date filters cleared");
              }}
            >
              Clear
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category === "All" ? null : category)}
              size="sm"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <LoadingSpinner className="py-20" size={48} />
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-muted-foreground mb-4">No events found matching your criteria</p>
          <p className="text-sm text-muted-foreground mb-4">
            {events.length > 0 && "Try adjusting your filters or search terms"}
          </p>
          {(startDate || endDate || searchQuery || selectedCategory) && (
            <Button 
              variant="outline" 
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setSearchQuery("");
                setSelectedCategory(null);
              }}
            >
              Clear All Filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground text-center">
            Displaying {filteredEvents.length} of {events.length} event{filteredEvents.length !== 1 ? 's' : ''}
            {(startDate || endDate || searchQuery || selectedCategory) && (
              <span className="ml-2 text-primary">(Filtered)</span>
            )}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(() => {
              // Force use of filteredEvents array
              const eventsToRender = filteredEvents;
              console.log("Rendering events grid - filteredEvents.length:", filteredEvents.length, "events.length:", events.length);
              console.log("Events to render:", eventsToRender.length);
              console.log("First 3 filtered events:", filteredEvents.slice(0, 3).map(e => e.name));
              
              if (eventsToRender.length === 0) {
                return (
                  <div className="col-span-full text-center py-12">
                    <p className="text-lg text-muted-foreground">No events match your filters</p>
                  </div>
                );
              }
              
              return eventsToRender.map((event, index) => (
            <Card
              key={`${event.id || event.name || index}-${index}`}
              className="card-hover overflow-hidden group animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
              onMouseEnter={() => handleEventView(event)}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={event.artist ? getArtistImage(event.artist) : (event.imageUrl || "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800")}
                  alt={event.artist ? event.artist : event.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800";
                  }}
                />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-white text-foreground">
                    {event.category}
                  </Badge>
                </div>
                {event.artist && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <Badge className="bg-black/70 text-white backdrop-blur-sm">
                      🎤 {event.artist}
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-3">{event.name}</h3>
                {event.artist && (
                  <p className="text-sm text-muted-foreground mb-2">🎵 {event.artist}</p>
                )}
                
                <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(event.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4" />
                    <span className="font-semibold text-foreground">₹{typeof event.price === 'number' ? event.price.toLocaleString('en-IN') : event.price || '0'}</span>
                  </div>
                </div>

                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {event.description}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <Button className="w-full" variant="outline" onClick={() => addToItinerary(event)}>
                    <Plus className="w-4 h-4 mr-2"/> Add to Trip
                  </Button>
                  <Button 
                    className="w-full gradient-hero text-white"
                    onClick={() => {
                      handleEventView(event);
                      if (isAuthenticated && token) {
                        saveEvent(token, {
                          event_id: event.id || event.name,
                          event_data: event,
                          action: "booked"
                        }).then(() => {
                          toast.success("Event booking saved!");
                        }).catch(() => {
                          toast.error("Failed to save booking");
                        });
                      } else {
                        toast.error("Please login to save bookings");
                      }
                    }}
                  >
                    Book Now
                  </Button>
                </div>
              </CardContent>
            </Card>
            ));
            })()}
          </div>
        </>
      )}

      {/* Itinerary */}
      <div className="max-w-5xl mx-auto mt-16">
        <h2 className="text-2xl font-bold mb-4">🧳 Your Trip Itinerary</h2>
        {itinerary.length === 0 ? (
          <p className="text-muted-foreground">No events added yet.</p>
        ) : (
          <Card className="card-glass">
            <CardContent className="p-0">
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="py-2 px-4">Name</th>
                      <th className="py-2 px-4">City/Venue</th>
                      <th className="py-2 px-4">Date</th>
                      <th className="py-2 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itinerary.map((e, idx) => (
                      <tr key={idx} className="border-t hover:bg-accent/50">
                        <td className="py-2 px-4 font-medium">{e.name}</td>
                        <td className="py-2 px-4">{e.location}</td>
                        <td className="py-2 px-4">{new Date(e.date).toLocaleString()}</td>
                        <td className="py-2 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromItinerary(e)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 flex gap-3">
                <Button onClick={downloadCsv}><Download className="w-4 h-4 mr-2"/>Download CSV</Button>
                <Button variant="outline" onClick={downloadIcs}><Calendar className="w-4 h-4 mr-2"/>Download .ics</Button>
                <Button variant="outline" onClick={generateMoodboard}><ImageIcon className="w-4 h-4 mr-2"/>Generate Moodboard</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Events;
