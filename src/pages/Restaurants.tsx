import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { saveRestaurantSearch, saveBooking, saveRestaurantFavorite, unsaveRestaurantFavorite } from "@/lib/api";
import { toast } from "sonner";

type PlaceResult = {
	name: string;
	addr: string;
	lat: number | null;
	lon: number | null;
	score: number;
	vibe: string;
};

const MAX_RESULTS = 15;

const MOOD_KEYWORDS: Record<string, string[]> = {
	POSITIVE: ["cafe", "coffee", "dessert", "ice cream", "bakery", "fast food", "juice"],
	NEGATIVE: ["thali", "comfort", "home", "dhaba", "veg", "simple", "dining hall"],
	ROMANTIC: ["rooftop", "view", "sea", "fine dining", "candle", "terrace", "romantic", "sunset"],
	NEUTRAL: ["restaurant", "hotel", "family", "buffet"],
};

const INTENT_KEYWORDS: Record<string, number> = {
	quiet: 1.2,
	luxury: 1.3,
	cheap: 1.1,
	street: 1.2,
	family: 1.2,
	romantic: 1.3,
	group: 1.1,
	quick: 1.1,
	"late night": 1.2,
};

function detectContextFromQuery(query: string): string {
	const q = query.toLowerCase();
	if (["rooftop", "view", "romantic", "date"].some((k) => q.includes(k))) return "ROMANTIC";
	if (["thali", "veg", "comfort", "dhaba"].some((k) => q.includes(k))) return "NEGATIVE";
	if (["coffee", "dessert", "cake", "ice cream"].some((k) => q.includes(k))) return "POSITIVE";
	return "NEUTRAL";
}

function generateVibeSummary(name: string): string {
	const n = name.toLowerCase();
	if (n.includes("thali")) return "A peaceful spot for homely thali meals 🍛";
	if (n.includes("cafe") || n.includes("coffee")) return "A chill cafe perfect for conversations ☕";
	if (n.includes("rooftop") || n.includes("view")) return "Romantic rooftop vibes with great ambience 🌇";
	if (n.includes("dhaba")) return "Authentic local flavors in a casual setup 🍽️";
	return "A great place to relax and enjoy good food 😋";
}

function computeMoodScore(name: string, mood: string, query: string): number {
	const text = name.toLowerCase();
	let score = 0;
	for (const kw of MOOD_KEYWORDS[mood] ?? []) {
		if (text.includes(kw)) score += 3;
	}
	for (const [kw, boost] of Object.entries(INTENT_KEYWORDS)) {
		if (query.toLowerCase().includes(kw)) score += boost;
	}
	return score;
}

function computeDistanceScore(lat1?: number | null, lon1?: number | null, lat2?: number | null, lon2?: number | null): number {
	if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
	const dist = Math.sqrt((lat1 - lat2) ** 2 + (lon1 - lon2) ** 2) * 111; // km
	return Math.max(0, 1 - dist / 10);
}

async function geoapifyGeocode(placeText: string, apiKey: string): Promise<{ lat: number | null; lon: number | null }> {
	const url = new URL("https://api.geoapify.com/v1/geocode/search");
	url.searchParams.set("text", placeText);
	url.searchParams.set("apiKey", apiKey);
	url.searchParams.set("limit", "1");
	const res = await fetch(url.toString());
	const data = await res.json();
	const feature = data?.features?.[0];
	if (feature?.geometry?.coordinates) {
		const [lon, lat] = feature.geometry.coordinates as [number, number];
		return { lat, lon };
	}
	return { lat: null, lon: null };
}

async function geoapifyFetchPlaces(lat: number, lon: number, radiusKm: number, apiKey: string, categories = "catering.restaurant,catering.cafe,catering.fast_food") {
	const url = new URL("https://api.geoapify.com/v2/places");
	url.searchParams.set("categories", categories);
	url.searchParams.set("filter", `circle:${lon},${lat},${radiusKm * 1000}`);
	url.searchParams.set("bias", `proximity:${lon},${lat}`);
	url.searchParams.set("limit", String(MAX_RESULTS));
	url.searchParams.set("apiKey", apiKey);
	const res = await fetch(url.toString());
	return res.json();
}

const Restaurants = () => {
	const { token, isAuthenticated, loadUserData } = useAuth();
	const apiKey = (import.meta as any).env?.VITE_GEOAPIFY_KEY as string | undefined;
	const [query, setQuery] = useState("");
	const [city, setCity] = useState("Dwarka Gujarat");
	const [foodPref, setFoodPref] = useState("Any");
	const [radiusKm, setRadiusKm] = useState(5);
	const [isLoading, setIsLoading] = useState(false);
	const [results, setResults] = useState<PlaceResult[]>([]);
	const [saved, setSaved] = useState<PlaceResult[]>([]);
	const [bookingFor, setBookingFor] = useState<number | null>(null);
	const [savedBookings, setSavedBookings] = useState<any[]>([]);
	const [savedFavorites, setSavedFavorites] = useState<PlaceResult[]>([]);

	// Load saved restaurant searches and bookings when auth changes
	useEffect(() => {
		const loadData = async () => {
			if (isAuthenticated && token) {
				try {
					const data = await loadUserData();
					console.log("Restaurants - Loaded user data:", data);
					if (data) {
						// Load restaurant searches
						if (data.restaurants && data.restaurants.length > 0) {
							const latest = data.restaurants[0];
							if (latest.results && latest.results.length > 0) {
								setResults(latest.results);
								if (latest.search_params) {
									setQuery(latest.search_params.query || "");
									setCity(latest.search_params.city || city);
									setFoodPref(latest.search_params.foodPref || "Any");
									setRadiusKm(latest.search_params.radiusKm || 5);
								}
								toast.success(`Loaded ${latest.results.length} saved restaurant result(s)`);
							}
						}
						
						// Load restaurant bookings from general bookings
						if (data.bookings) {
							const restaurantBookings = data.bookings.filter((b: any) => 
								b.type === "restaurant" || (b.booking_data && b.booking_data.restaurant_name)
							);
							setSavedBookings(restaurantBookings);
							if (restaurantBookings.length > 0) {
								toast.success(`Loaded ${restaurantBookings.length} saved restaurant booking(s)`);
							}
						}
						
						// Load saved favorite restaurants
						if (data.saved_restaurants && data.saved_restaurants.length > 0) {
							const favorites = data.saved_restaurants.map((sr: any) => sr.restaurant_data);
							setSavedFavorites(favorites);
							setSaved(favorites); // Also set to saved state
							if (favorites.length > 0) {
								toast.success(`Loaded ${favorites.length} saved favorite restaurant(s)`);
							}
						}
					}
				} catch (err) {
					console.error("Failed to load saved restaurants:", err);
				}
			}
		};
		loadData();
	}, [isAuthenticated, token]);

	const mood = useMemo(() => detectContextFromQuery(query), [query]);

	async function onSearch() {
		if (!query.trim()) return;
		if (!apiKey) {
			setResults([]);
			return;
		}
		setIsLoading(true);
		try {
			const { lat, lon } = await geoapifyGeocode(city, apiKey);
			if (lat == null || lon == null) {
				setResults([]);
				setIsLoading(false);
				return;
			}
			const data = await geoapifyFetchPlaces(lat, lon, radiusKm, apiKey);
			const features: any[] = data?.features ?? [];
			const computed: PlaceResult[] = features.map((f) => {
				const props = f?.properties ?? {};
				const name: string = props?.name || "Unnamed";
				const addr: string = props?.address_line2 || props?.formatted || "";
				const plat: number | null = props?.lat ?? null;
				const plon: number | null = props?.lon ?? null;
				const mscore = computeMoodScore(name, mood, query);
				const dscore = computeDistanceScore(lat, lon, plat, plon);
				const total = 0.6 * mscore + 0.4 * dscore;
				return { name, addr, lat: plat, lon: plon, score: total, vibe: generateVibeSummary(name) };
			});
			computed.sort((a, b) => b.score - a.score);
			const finalResults = computed.slice(0, MAX_RESULTS);
			setResults(finalResults);
			
			// Save search to backend if authenticated
			if (isAuthenticated && token) {
				saveRestaurantSearch(token, {
					search_params: { query, city, foodPref, radiusKm },
					results: finalResults
				}).catch((err) => {
					console.error("Failed to save restaurant search:", err);
				});
			}
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="container mx-auto px-4 py-10">
			<div className="max-w-3xl mx-auto">
				<div className="text-center mb-8 animate-fade-in">
					<h1 className="text-4xl font-bold mb-4">🍽️ Discover Restaurants</h1>
					<p className="text-lg text-muted-foreground">
						Find the perfect dining experience based on your mood and preferences
					</p>
				</div>


				<Card className="mb-8">
					<CardHeader>
						<CardTitle>Search Settings</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="query">Describe what you're looking for</Label>
							<Input id="query" placeholder="e.g. romantic rooftop cafe in Jaipur" value={query} onChange={(e) => setQuery(e.target.value)} />
						</div>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label htmlFor="city">City</Label>
								<Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
							</div>
							<div className="space-y-2">
								<Label>Food Preference</Label>
								<Select value={foodPref} onValueChange={setFoodPref}>
									<SelectTrigger>
										<SelectValue placeholder="Any" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Any">Any</SelectItem>
										<SelectItem value="Veg">Veg</SelectItem>
										<SelectItem value="Non-Veg">Non-Veg</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="radius">Radius (km)</Label>
								<Input id="radius" type="number" min={1} max={15} value={radiusKm} onChange={(e) => setRadiusKm(Math.max(1, Math.min(15, Number(e.target.value) || 1)))} />
							</div>
						</div>
						<div className="flex items-center gap-3 pt-2">
							<Button onClick={onSearch} disabled={isLoading || !query.trim()}>
								{isLoading ? "Searching..." : "Search Now"}
							</Button>
							{!apiKey && (
								<span className="text-amber-600 text-sm">Set VITE_GEOAPIFY_KEY to enable search.</span>
							)}
						</div>
					</CardContent>
				</Card>

				{query.trim() && (
					<p className="mb-6">✨ Auto Detected → Mood: <b>{mood}</b>, Food: <b>{foodPref}</b>, City: <b>{city}</b></p>
				)}

				<div className="space-y-6">
					{!isLoading && results.length === 0 && query.trim() && (
						<Card>
							<CardContent className="py-6 text-muted-foreground">No restaurants found. Try expanding radius or changing query.</CardContent>
						</Card>
					)}

					{results.map((r, idx) => (
						<Card key={`${r.name}-${idx}`} className="border">
							<CardHeader className="pb-2">
								<CardTitle className="flex items-center justify-between gap-4">
									<span>{idx + 1}. {r.name} — <span className="font-normal text-muted-foreground">{r.vibe}</span></span>
									{r.lat != null && r.lon != null && (
										<a className="text-primary text-sm" href={`https://www.google.com/maps/place/${r.lat},${r.lon}`} target="_blank" rel="noreferrer">📍 Open in Google Maps</a>
									)}
								</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
								<div className="text-sm text-muted-foreground">{r.addr}</div>
								<div className="flex items-center gap-2">
									<Button 
										variant="secondary" 
										onClick={async () => {
											const isAlreadySaved = saved.find((x) => x.name === r.name);
											if (isAlreadySaved) {
												// Unsave
												setSaved((s) => s.filter((x) => x.name !== r.name));
												if (isAuthenticated && token) {
													unsaveRestaurantFavorite(token, r.name).catch((err) => {
														console.error("Failed to unsave restaurant:", err);
													});
												}
												toast.info(`Removed ${r.name} from favorites`);
											} else {
												// Save
												setSaved((s) => [...s, r]);
												if (isAuthenticated && token) {
													saveRestaurantFavorite(token, r.name, r).then(() => {
														toast.success(`Saved ${r.name} to favorites!`);
													}).catch((err) => {
														console.error("Failed to save restaurant:", err);
														toast.error("Failed to save restaurant");
													});
												} else {
													toast.warning("Please login to save restaurants");
												}
											}
										}}
									>
										{saved.find((x) => x.name === r.name) ? "⭐ Saved" : "⭐ Save"}
									</Button>
									<Button onClick={() => setBookingFor(idx)}>📅 Book</Button>
								</div>
							</CardContent>
							{bookingFor === idx && (
								<CardContent className="pt-0 pb-6">
									<div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
										<div className="space-y-1">
											<Label htmlFor="name">Your name</Label>
											<Input id="name" placeholder="Your name" />
										</div>
										<div className="space-y-1">
											<Label htmlFor="date">Date</Label>
											<Input id="date" type="date" />
										</div>
										<div className="space-y-1">
											<Label htmlFor="time">Time</Label>
											<Input id="time" type="time" />
										</div>
										<div className="space-y-1">
											<Label htmlFor="guests">Guests</Label>
											<Input id="guests" type="number" min={1} max={10} defaultValue={2} />
										</div>
									</div>
									<div className="pt-3">
										<Button onClick={async () => {
											if (isAuthenticated && token) {
												try {
													// Save restaurant booking
													const bookingInfo = {
														restaurant_name: r.name,
														restaurant_address: r.addr,
														booking_date: (document.getElementById("date") as HTMLInputElement)?.value,
														booking_time: (document.getElementById("time") as HTMLInputElement)?.value,
														guests: parseInt((document.getElementById("guests") as HTMLInputElement)?.value || "2"),
														guest_name: (document.getElementById("name") as HTMLInputElement)?.value,
													};
													// Save as a booking
													await saveBooking(token, {
														type: "restaurant",
														booking_data: bookingInfo,
														created_at: new Date().toISOString()
													});
													toast.success("Restaurant booking saved!");
													setBookingFor(null);
													// Refresh bookings
													const data = await loadUserData();
													if (data && data.bookings) {
														const restaurantBookings = data.bookings.filter((b: any) => 
															b.type === "restaurant" || (b.booking_data && b.booking_data.restaurant_name)
														);
														setSavedBookings(restaurantBookings);
													}
												} catch (err) {
													toast.error("Failed to save booking. Please try again.");
												}
											} else {
												toast.error("Please login to save bookings");
											}
										}}>Confirm Booking</Button>
									</div>
								</CardContent>
							)}
						</Card>
					))}
				</div>

				{/* Saved Favorite Restaurants */}
				{isAuthenticated && saved.length > 0 && (
					<Card className="mt-10">
						<CardHeader>
							<CardTitle>⭐ My Saved Favorite Restaurants</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{saved.map((s, idx) => (
									<div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent">
										<div className="flex-1">
											<h3 className="font-semibold">{s.name}</h3>
											<p className="text-sm text-muted-foreground">{s.addr}</p>
											{s.vibe && (
												<Badge variant="secondary" className="mt-1 text-xs">{s.vibe}</Badge>
											)}
										</div>
										<div className="flex items-center gap-2">
											{s.lat != null && s.lon != null && (
												<a 
													className="text-primary text-sm" 
													href={`https://www.google.com/maps/place/${s.lat},${s.lon}`} 
													target="_blank" 
													rel="noreferrer"
												>
													📍 Map
												</a>
											)}
											<Button
												variant="ghost"
												size="sm"
												onClick={async () => {
													setSaved((prev) => prev.filter((x) => x.name !== s.name));
													if (isAuthenticated && token) {
														await unsaveRestaurantFavorite(token, s.name);
														toast.success(`Removed ${s.name} from favorites`);
													}
												}}
												className="text-destructive hover:text-destructive"
											>
												Remove
											</Button>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Saved Restaurant Bookings */}
				{isAuthenticated && savedBookings.length > 0 && (
					<Card className="mt-10">
						<CardHeader>
							<CardTitle>📅 Your Restaurant Bookings</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{savedBookings.map((booking, idx) => {
									const b = booking.booking_data || booking;
									return (
										<div key={idx} className="p-3 border rounded-lg">
											<h3 className="font-semibold">{b.restaurant_name || "Restaurant"}</h3>
											<p className="text-sm text-muted-foreground">{b.restaurant_address || ""}</p>
											<div className="mt-2 text-sm">
												<p><strong>Date:</strong> {b.booking_date || "N/A"}</p>
												<p><strong>Time:</strong> {b.booking_time || "N/A"}</p>
												<p><strong>Guests:</strong> {b.guests || "N/A"}</p>
												<p><strong>Name:</strong> {b.guest_name || "N/A"}</p>
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
};

export default Restaurants;


