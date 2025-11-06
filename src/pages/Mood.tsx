import { useState, useEffect } from "react";
import { Smile, MapPin, ExternalLink, History, Trash2, Heart, Share2, Navigation, CalendarPlus, Star, Filter, SortAsc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { analyzeMood, getMoodPlaceRecommendations } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { saveMoodAnalysis, saveEvent } from "@/lib/api";
import { useNavigate } from "react-router-dom";

const Mood = () => {
  const { token, isAuthenticated, loadUserData } = useAuth();
  const navigate = useNavigate();
  const [textInput, setTextInput] = useState("");
  const [address, setAddress] = useState("");
  const [foodPref, setFoodPref] = useState("any");
  const [radius, setRadius] = useState(10);
  const [moodResult, setMoodResult] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "results">("input");
  const [moodHistory, setMoodHistory] = useState<any[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"default" | "name" | "category">("default");
  const [expandedPlace, setExpandedPlace] = useState<number | null>(null);

  // Load saved mood analysis when auth changes
  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated && token) {
        try {
          const data = await loadUserData();
          console.log("Mood - Loaded user data:", data);
          if (data && data.moods && data.moods.length > 0) {
            // Set mood history
            setMoodHistory(data.moods);
            
            // Load the most recent mood analysis
            const latest = data.moods[0];
            if (latest.mood_result && latest.recommendations) {
              setMoodResult(latest.mood_result);
              setRecommendations(latest.recommendations || []);
              setTextInput(latest.text_input || "");
              setStep("results");
              toast.success(`Loaded your last mood analysis. You have ${data.moods.length} saved mood analysis(es)`);
            }
          }
        } catch (err) {
          console.error("Failed to load saved mood data:", err);
        }
      }
    };
    loadData();
  }, [isAuthenticated, token]);

  const handleAnalyzeMood = async () => {
    if (!textInput.trim()) {
      toast.error("Please describe your mood");
      return;
    }
    if (!address.trim()) {
      toast.error("Please enter your address/location");
      return;
    }

    setLoading(true);
    try {
      const result = await getMoodPlaceRecommendations({
        text: textInput,
        address: address,
        food_pref: foodPref,
        radius: radius,
      });

      const moodData = {
        mood: result.mood,
        confidence: result.confidence,
        text: result.text || textInput,
      };
      setMoodResult(moodData);
      setRecommendations(result.recommendations || []);
      setStep("results");
      toast.success(`Found ${result.recommendations?.length || 0} recommendations for your ${result.mood} mood!`);
      
      // Save to backend if authenticated
      if (isAuthenticated && token) {
        saveMoodAnalysis(token, {
          text_input: textInput,
          mood_result: moodData,
          recommendations: result.recommendations || []
        }).then(() => {
          console.log("Mood analysis saved successfully");
          // Reload mood history
          loadUserData().then((data) => {
            if (data && data.moods) {
              setMoodHistory(data.moods);
            }
          });
        }).catch((err) => {
          console.error("Failed to save mood analysis:", err);
        });
      }
    } catch (error: any) {
      console.error("Error getting recommendations:", error);
      toast.error(error?.message || "Failed to get recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTextInput("");
    setAddress("");
    setFoodPref("any");
    setRadius(10);
    setMoodResult(null);
    setRecommendations([]);
    setStep("input");
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 gradient-sunset rounded-2xl mb-4">
            <Smile className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">How Are You Feeling?</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Describe your mood and location, and we'll recommend the perfect spots for you
          </p>
        </div>

        {/* Input Form */}
        {step === "input" && (
          <Card className="card-glass animate-scale-in">
            <CardHeader>
              <CardTitle>Tell Us About Your Mood</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="mood-text">Describe your current mood or feeling</Label>
                <Input
                  id="mood-text"
                  placeholder="e.g., I'm feeling happy and energetic today..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="address">Your Address/City/State</Label>
                <Input
                  id="address"
                  placeholder="e.g., Mumbai, Maharashtra"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="food-pref">Food Preference</Label>
                  <Select value={foodPref} onValueChange={setFoodPref}>
                    <SelectTrigger id="food-pref" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="veg">Vegetarian</SelectItem>
                      <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="radius">Search Radius (km)</Label>
                  <Input
                    id="radius"
                    type="number"
                    min="1"
                    max="50"
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value) || 10)}
                    className="mt-2"
                  />
                </div>
              </div>

              <Button
                size="lg"
                className="w-full gradient-hero text-white"
                onClick={handleAnalyzeMood}
                disabled={loading || !textInput.trim() || !address.trim()}
              >
                {loading ? "Analyzing..." : "Get Recommendations"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="card-glass animate-pulse">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 gradient-hero rounded-full mx-auto mb-4 animate-spin" />
              <p className="text-lg text-muted-foreground">Analyzing your mood and finding perfect matches...</p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {!loading && step === "results" && recommendations.length > 0 && (
          <div className="space-y-6 animate-fade-in">
            {/* Mood Result Badge */}
            {moodResult && (
              <Card className="card-glass">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Detected Mood</p>
                      <Badge variant="secondary" className="text-lg px-4 py-2">
                        {moodResult.mood} ({(moodResult.confidence * 100).toFixed(1)}% confidence)
                      </Badge>
                    </div>
                    <Button variant="outline" onClick={resetForm}>
                      Try Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                <h2 className="text-2xl font-bold">
                  Recommended Places ({recommendations.length})
                </h2>
                <div className="flex items-center gap-2">
                  <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                    <SelectTrigger className="w-[180px]">
                      <SortAsc className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Order</SelectItem>
                      <SelectItem value="name">Sort by Name</SelectItem>
                      <SelectItem value="category">Sort by Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4">
                {[...recommendations]
                  .sort((a, b) => {
                    if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
                    if (sortBy === "category") return (a.category || "").localeCompare(b.category || "");
                    return 0;
                  })
                  .map((rec, index) => {
                    const isSaved = savedPlaces.has(rec.name);
                    const isExpanded = expandedPlace === index;
                    const directionsLink = rec.lat && rec.lon 
                      ? `https://www.google.com/maps/dir/?api=1&destination=${rec.lat},${rec.lon}`
                      : null;

                    return (
                      <Card key={index} className="card-glass hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge variant="secondary" className="text-sm">
                                  {rec.category || "Place"}
                                </Badge>
                                <span className="text-sm text-muted-foreground">#{index + 1}</span>
                                {isSaved && (
                                  <Badge variant="default" className="text-xs">
                                    <Star className="w-3 h-3 mr-1" />
                                    Saved
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-xl font-bold mb-2">
                                {rec.name || "Unknown Place"}
                              </h3>
                              {rec.lat && rec.lon && (
                                <p className="text-sm text-muted-foreground mb-3">
                                  📍 Coordinates: {rec.lat.toFixed(4)}, {rec.lon.toFixed(4)}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              {rec.maps_link && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(rec.maps_link, "_blank")}
                                  className="flex-shrink-0"
                                >
                                  <MapPin className="w-4 h-4 mr-2" />
                                  View Map
                                  <ExternalLink className="w-3 h-3 ml-2" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                            {rec.maps_link && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => window.open(rec.maps_link, "_blank")}
                              >
                                <MapPin className="w-4 h-4 mr-1" />
                                View on Map
                              </Button>
                            )}
                            {directionsLink && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => window.open(directionsLink, "_blank")}
                              >
                                <Navigation className="w-4 h-4 mr-1" />
                                Get Directions
                              </Button>
                            )}
                            <Button
                              variant={isSaved ? "default" : "secondary"}
                              size="sm"
                              onClick={() => {
                                const newSaved = new Set(savedPlaces);
                                if (isSaved) {
                                  newSaved.delete(rec.name);
                                  toast.info(`Removed ${rec.name} from favorites`);
                                } else {
                                  newSaved.add(rec.name);
                                  toast.success(`Saved ${rec.name} to favorites!`);
                                }
                                setSavedPlaces(newSaved);
                              }}
                            >
                              <Heart className={`w-4 h-4 mr-1 ${isSaved ? "fill-current" : ""}`} />
                              {isSaved ? "Saved" : "Save"}
                            </Button>
                            {isAuthenticated && token && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    await saveEvent(token, {
                                      event_id: `mood_${rec.name}_${Date.now()}`,
                                      event_data: {
                                        name: rec.name,
                                        category: rec.category,
                                        location: `${rec.lat}, ${rec.lon}`,
                                        maps_link: rec.maps_link,
                                        type: "mood_recommendation",
                                        mood: moodResult?.mood,
                                      },
                                      action: "added_to_itinerary"
                                    });
                                    toast.success(`Added ${rec.name} to your itinerary!`);
                                  } catch (err: any) {
                                    console.error("Failed to add to itinerary:", err);
                                    toast.error("Failed to add to itinerary. Please try again.");
                                  }
                                }}
                              >
                                <CalendarPlus className="w-4 h-4 mr-1" />
                                Add to Itinerary
                              </Button>
                            )}
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                const shareText = `Check out ${rec.name} - ${rec.category || "Place"}\n${rec.maps_link || ""}`;
                                if (navigator.share) {
                                  navigator.share({
                                    title: rec.name,
                                    text: shareText,
                                    url: rec.maps_link || window.location.href
                                  }).catch(() => {
                                    navigator.clipboard.writeText(shareText);
                                    toast.success("Link copied to clipboard!");
                                  });
                                } else {
                                  navigator.clipboard.writeText(shareText);
                                  toast.success("Link copied to clipboard!");
                                }
                              }}
                            >
                              <Share2 className="w-4 h-4 mr-1" />
                              Share
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedPlace(isExpanded ? null : index)}
                            >
                              {isExpanded ? "Show Less" : "More Details"}
                            </Button>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t space-y-2 animate-fade-in">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="font-semibold text-muted-foreground mb-1">Category</p>
                                  <p>{rec.category || "N/A"}</p>
                                </div>
                                {rec.lat && rec.lon && (
                                  <div>
                                    <p className="font-semibold text-muted-foreground mb-1">Location</p>
                                    <p>{rec.lat.toFixed(6)}, {rec.lon.toFixed(6)}</p>
                                  </div>
                                )}
                              </div>
                              {moodResult && (
                                <div className="mt-3">
                                  <p className="text-sm text-muted-foreground">
                                    Recommended for your <Badge variant="secondary">{moodResult.mood}</Badge> mood
                                  </p>
                                </div>
                              )}
                              <div className="flex gap-2 mt-3">
                                {rec.maps_link && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(rec.maps_link, "_blank")}
                                  >
                                    <ExternalLink className="w-4 h-4 mr-1" />
                                    Open in Google Maps
                                  </Button>
                                )}
                                {isAuthenticated && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate("/events")}
                                  >
                                    View My Itinerary
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && step === "results" && recommendations.length === 0 && (
          <Card className="card-glass">
            <CardContent className="p-12 text-center">
              <p className="text-lg text-muted-foreground mb-4">
                No recommendations found for your location. Try adjusting the search radius or location.
              </p>
              <Button variant="outline" onClick={resetForm}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Mood History */}
        {isAuthenticated && moodHistory.length > 0 && (
          <Card className="card-glass mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Your Mood Analysis History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {moodHistory.map((mood, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => {
                      if (mood.mood_result && mood.recommendations) {
                        setMoodResult(mood.mood_result);
                        setRecommendations(mood.recommendations || []);
                        setTextInput(mood.text_input || "");
                        setStep("results");
                        toast.success(`Loaded mood analysis: ${mood.mood_result?.mood || 'Mood'}`);
                      }
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">
                          {mood.mood_result?.mood || "Unknown"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {(mood.mood_result?.confidence * 100)?.toFixed(1) || "0"}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {mood.text_input?.substring(0, 100)}
                        {mood.text_input && mood.text_input.length > 100 ? "..." : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {mood.recommendations?.length || 0} recommendations
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (mood.mood_result && mood.recommendations) {
                          setMoodResult(mood.mood_result);
                          setRecommendations(mood.recommendations || []);
                          setTextInput(mood.text_input || "");
                          setStep("results");
                        }
                      }}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Mood;
