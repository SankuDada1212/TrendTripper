// API configuration and helper functions
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// Get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

// Generic API call wrapper
export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> || {}),
    };
    
    // Add auth token if available and not already in headers
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API Error: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Monument identification API
export async function identifyMonument(image: File) {
  const formData = new FormData();
  formData.append('file', image);

  const response = await fetch(`http://127.0.0.1:8000/predict/`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Monument identification failed');
  }

  return await response.json();
}

// Mood-based recommendations API
export async function getMoodRecommendations(mood: string) {
  return apiCall(`/api/mood?mood=${encodeURIComponent(mood)}`);
}

// New mood analysis endpoints (Code 1 + Code 2 + Code 3)
export async function analyzeMood(text: string) {
  return apiCall(`/api/mood/analyze`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function getMoodPlaceRecommendations(params: {
  text: string;
  address: string;
  food_pref?: string;
  radius?: number;
}) {
  return apiCall(`/api/mood/recommendations`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// SOS emergency API
export async function sendSOS(location: { latitude: number; longitude: number }) {
  return apiCall('/api/sos', {
    method: 'POST',
    body: JSON.stringify(location),
  });
}

export async function retryPendingSOS() {
  return apiCall('/api/sos/retry', {
    method: 'POST',
  });
}

// Events API
export async function getEvents(location?: string) {
  const query = location ? `?location=${encodeURIComponent(location)}` : '';
  return apiCall(`/api/events${query}`);
}

// Budget planner API
export async function calculateBudget(tripDetails: {
  destination: string;
  days: number;
  people: number;
  preferences: string[];
}) {
  return apiCall('/api/budget', {
    method: 'POST',
    body: JSON.stringify(tripDetails),
  });
}

// Hotels API
export async function getHotels(params?: {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  hotel_type?: string;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
}) {
  const query = params
    ? '?' + new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>)
      ).toString()
    : '';
  return apiCall(`/api/hotel${query}`);
}

export async function getHotelCities() {
  return apiCall(`/api/hotel/cities`);
}

// Travel booking API
export async function getTravelOptions(params: {
  from: string;
  to: string;
  date: string;
  type?: 'train' | 'flight' | 'cab';
}) {
  const query = new URLSearchParams(params as any).toString();
  return apiCall(`/api/travel?${query}`);
}

// Booking endpoints
export async function bookingConfig() {
  return apiCall(`/booking/config`);
}

export async function bookingFlightInfo(params: { from: string; to: string }) {
  const q = new URLSearchParams({ from_city: params.from, to_city: params.to }).toString();
  return apiCall(`/booking/flight_info?${q}`);
}

export async function bookingCityPrice(payload: {
  city: string;
  origin: string;
  dest_city: string;
  destination: string;
  vehicle_name: string;
}) {
  return apiCall(`/booking/city/price`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function bookingFlightPrice(payload: { from_city: string; to_city: string }) {
  return apiCall(`/booking/flight/price`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function bookingConfirm(payment_mode: string) {
  return apiCall(`/booking/confirm`, { method: 'POST', body: JSON.stringify({ payment_mode }) });
}

export async function bookingHistory() {
  return apiCall(`/booking/history`);
}

// Authentication API
export async function registerUser(username: string, email: string, password: string) {
  return apiCall(`/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
}

export async function loginUser(username: string, password: string) {
  return apiCall(`/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function getCurrentUser(token: string) {
  return apiCall(`/api/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}

// User Data API
export async function getUserData(token: string) {
  return apiCall(`/api/user/data`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}

export async function saveBudgetData(token: string, trips: any, expenses: any[]) {
  return apiCall(`/api/user/budget`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ trips, expenses }),
  });
}

export async function saveBooking(token: string, bookingData: any) {
  return apiCall(`/api/user/bookings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(bookingData),
  });
}

export async function getUserBookings(token: string) {
  return apiCall(`/api/user/bookings`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}

export async function saveSearch(token: string, searchData: any) {
  return apiCall(`/api/user/searches`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(searchData),
  });
}

export async function saveMoodAnalysis(token: string, moodData: any) {
  return apiCall(`/api/user/mood`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(moodData),
  });
}

export async function saveRestaurantSearch(token: string, restaurantData: any) {
  return apiCall(`/api/user/restaurants`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(restaurantData),
  });
}

export async function saveEvent(token: string, eventData: any) {
  return apiCall(`/api/user/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(eventData),
  });
}

export async function saveHotel(token: string, hotelData: any) {
  return apiCall(`/api/user/hotels`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(hotelData),
  });
}

export async function bookHotel(token: string, bookingData: any) {
  return apiCall(`/api/user/hotels/book`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(bookingData),
  });
}

export async function deleteHotelBooking(token: string, bookingId: string) {
  return apiCall(`/api/user/hotels/booking/delete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ booking_id: bookingId }),
  });
}

export async function deleteBudgetTrip(token: string, tripName: string) {
  return apiCall(`/api/user/budget/trip/delete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ trip_name: tripName }),
  });
}

export async function deleteEventFromItinerary(token: string, eventId: string) {
  return apiCall(`/api/user/events/delete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ event_id: eventId }),
  });
}

export async function saveRestaurantFavorite(token: string, restaurantName: string, restaurantData: any) {
  return apiCall(`/api/user/restaurants/save`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ restaurant_name: restaurantName, restaurant_data: restaurantData }),
  });
}

export async function unsaveRestaurantFavorite(token: string, restaurantName: string) {
  return apiCall(`/api/user/restaurants/unsave`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ restaurant_name: restaurantName }),
  });
}
