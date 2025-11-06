import { useState, useEffect } from "react";
import {
  Upload,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Calendar,
  Info,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { saveSearch } from "@/lib/api";

const API_BASE = "http://localhost:8000";

const Discover = () => {
  const { token, isAuthenticated, loadUserData } = useAuth();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);

  // Load saved searches on mount and when auth changes
  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated && token) {
        try {
          const data = await loadUserData();
          console.log("Discover - Loaded user data:", data);
          if (data && data.searches && data.searches.length > 0) {
            setSearchHistory(data.searches);
            // Show the most recent search if available
            const latestSearch = data.searches[0];
            if (latestSearch && latestSearch.data) {
              setResult(latestSearch.data);
              toast.success(`Loaded your last search: ${latestSearch.monument || 'Monument'}`);
            }
          }
        } catch (err) {
          console.error("Failed to load search history:", err);
        }
      }
    };
    loadData();
  }, [isAuthenticated, token]);

  // 🔹 Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 🔹 Identify monument using FastAPI and then fetch full info
  const handleIdentify = async () => {
    if (!selectedImage) {
      toast.error("Please upload an image first");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedImage);

      // Step 1️⃣ — Identify monument via CNN model
      const res = await axios.post(`${API_BASE}/predict`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { monument } = res.data;
      toast.success(`Monument identified: ${monument}`);

      // Step 2️⃣ — Fetch complete info (history, AI facts, etc.)
      const infoRes = await axios.get(`${API_BASE}/get_monument_info`, {
        params: { monument_name: monument },
      });

      const fullData = { ...res.data, ...infoRes.data };
      setResult(fullData);
      
      // Save search to backend if authenticated
      if (isAuthenticated && token) {
        saveSearch(token, { monument: fullData.monument, ...fullData }).then(() => {
          console.log("Search saved successfully");
          // Refresh search history
          loadUserData().then((data) => {
            if (data && data.searches) {
              setSearchHistory(data.searches);
            }
          });
        }).catch((err) => {
          console.error("Failed to save search:", err);
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to identify monument. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Reset to upload another image
  const reset = () => {
    setResult(null);
    setPreview("");
    setSelectedImage(null);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 gradient-hero rounded-2xl mb-4">
            <ImageIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Discover Monuments</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload an image of a monument to explore its history, facts, and AI insights.
          </p>
        </div>

        {/* Upload Section */}
        {!result && (
          <Card className="card-glass mb-8 animate-scale-in">
            <CardContent className="p-8">
              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center gap-4"
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-64 rounded-lg shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 gradient-ocean rounded-2xl flex items-center justify-center">
                      <Upload className="w-12 h-12 text-white" />
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-semibold mb-1">
                      {preview ? "Change Image" : "Upload Monument Image"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Click to browse or drag and drop
                    </p>
                  </div>
                </label>
              </div>

              {preview && (
                <Button
                  onClick={handleIdentify}
                  disabled={loading}
                  size="lg"
                  className="w-full mt-6 gradient-hero text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Identifying...
                    </>
                  ) : (
                    <>
                      <Info className="w-5 h-5 mr-2" />
                      Identify Monument
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Images */}
            <Card className="card-glass overflow-hidden">
              <div className="grid md:grid-cols-2 gap-6 p-6">
                <div className="space-y-4">
                  {result.old_image ? (
                    <>
                      <img
                        src={result.old_image}
                        alt={`${result.monument} historic`}
                        className="w-full h-64 object-cover rounded-xl"
                      />
                      <p className="text-sm text-muted-foreground text-center">
                        Historic View
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">
                      Historic image not available.
                    </p>
                  )}
                </div>
                {result.new_image && (
                  <div className="space-y-4">
                    <img
                      src={result.new_image}
                      alt={`${result.monument} recent`}
                      className="w-full h-64 object-cover rounded-xl"
                    />
                    <p className="text-sm text-muted-foreground text-center">
                      Current View
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Details */}
            <Card className="card-glass">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl mb-2">
                      {result.monument}
                    </CardTitle>
                    {result.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{result.location}</span>
                      </div>
                    )}
                  </div>
                  {result.yearBuilt && (
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Built</div>
                      <div className="text-2xl font-bold text-primary">
                        {result.yearBuilt}
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Description */}
                {result.description && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Description</h3>
                    <p className="text-muted-foreground">
                      {result.description}
                    </p>
                  </div>
                )}

                {/* AI Facts */}
                {result.ai_summary && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      AI-Generated Insight
                    </h3>
                    <p className="text-muted-foreground">
                      {result.ai_summary}
                    </p>
                  </div>
                )}

                {/* Timeline */}
                {Array.isArray(result.timeline) && result.timeline.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Timeline
                    </h3>
                    <div className="space-y-3">
                      {result.timeline
                        .slice()
                        .sort((a: any, b: any) => a.year - b.year)
                        .map((t: { year: number; event: string }, index: number) => (
                          <div
                            key={index}
                            className="flex gap-4 items-start animate-fade-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <div className="w-3 h-3 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                            <p className="text-muted-foreground">
                              <span className="font-semibold mr-2">{t.year}</span>
                              {t.event}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Reset Button */}
                <Button onClick={reset} variant="outline" className="w-full">
                  Identify Another Monument
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search History */}
        {isAuthenticated && searchHistory.length > 0 && (
          <Card className="card-glass mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Your Search History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {searchHistory.map((search, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => {
                      if (search.data) {
                        setResult(search.data);
                        toast.success(`Loaded: ${search.monument}`);
                      }
                    }}
                  >
                    <div>
                      <p className="font-semibold">{search.monument}</p>
                      <p className="text-sm text-muted-foreground">
                        {search.data?.description?.substring(0, 100)}...
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
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

export default Discover;
