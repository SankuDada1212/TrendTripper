import { useState } from "react";
import { Smile, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { analyzeMood, getMoodPlaceRecommendations } from "@/lib/api";

const Mood = () => {
  const [textInput, setTextInput] = useState("");
  const [address, setAddress] = useState("");
  const [foodPref, setFoodPref] = useState("any");
  const [radius, setRadius] = useState(10);
  const [moodResult, setMoodResult] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "results">("input");

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

      setMoodResult({
        mood: result.mood,
        confidence: result.confidence,
        text: result.text || textInput,
      });
      setRecommendations(result.recommendations || []);
      setStep("results");
      toast.success(`Found ${result.recommendations?.length || 0} recommendations for your ${result.mood} mood!`);
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                  Recommended Places ({recommendations.length})
                </h2>
              </div>

              <div className="grid gap-4">
                {recommendations.map((rec, index) => (
                  <Card key={index} className="card-glass hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="secondary" className="text-sm">
                              {rec.category || "Place"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">#{index + 1}</span>
                          </div>
                          <h3 className="text-xl font-bold mb-2">
                            {rec.name || "Unknown Place"}
                          </h3>
                        </div>
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
                    </CardContent>
                  </Card>
                ))}
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
      </div>
    </div>
  );
};

export default Mood;
