// API configuration and helper functions
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// Generic API call wrapper
export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
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
