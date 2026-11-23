// Hand-written mirrors of the Pydantic models in backend/models/booking.py.
// Nothing infers across the HTTP boundary — keep these in sync in the same edit.

export type BookingStatus = "new" | "confirmed" | "completed" | "cancelled";
export type TripType = "one_way" | "round_trip";

export interface VehicleTier {
  id: string;
  name: string;
  capacity: string;
  rate_per_km: number; // one-way rate
  round_trip_rate: number;
  driver_allowance: number; // batta (per day on round trips)
  tag: string;
  best_for: string;
}

export interface PopularRoute {
  from_city: string;
  to_city: string;
  distance_km: number;
  duration: string;
  prices: Record<string, number>;
  tag: string;
}

// GET /api/meta
export interface MetaResponse {
  cities: string[];
  vehicles: VehicleTier[];
  routes: PopularRoute[];
  hotline: string;
  whatsapp_number: string;
  email: string;
  address: string;
  maps_enabled: boolean;
  today: string;
}

// POST /api/enquiries + GET /api/enquiries (mirrors Enquiry)
export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  created_at: string;
}

// POST /api/quote (mirrors QuoteResponse)
export interface Quote {
  from_city: string;
  to_city: string;
  vehicle_id: string;
  vehicle_name: string;
  distance_km: number;
  duration: string;
  rate_per_km: number;
  base_fare: number;
  driver_allowance: number;
  total: number;
  fixed_price: boolean;
  trip_type: TripType;
  days: number;
  toll_note: string;
}

// POST /api/quote/options (mirrors QuoteOptions)
export interface QuoteOptions {
  from_city: string;
  to_city: string;
  road_km: number;
  duration: string;
  trip_type: TripType;
  days: number;
  quotes: Quote[];
}

// GET /api/places/autocomplete (mirrors PlaceSuggestion). place_id "city:<name>" = our city list.
export interface PlaceSuggestion {
  place_id: string;
  main_text: string;
  secondary_text: string;
  label: string;
}

// POST /api/leads (mirrors LeadResponse)
export interface LeadResponse {
  ok: boolean;
  emailed: boolean;
}

// POST /api/bookings + GET /api/bookings (mirrors Booking)
export interface Booking {
  id: string;
  customer_name: string;
  phone: string;
  pickup_city: string;
  drop_city: string;
  pickup_address: string;
  drop_address: string;
  pickup_date: string;
  pickup_time: string;
  vehicle_id: string;
  vehicle_name: string;
  notes: string;
  distance_km: number;
  fare_total: number;
  fare_fixed: boolean;
  trip_type: TripType;
  return_date: string;
  days: number;
  pickup_place_id: string;
  drop_place_id: string;
  road_km: number; // one-way road distance
  duration: string; // one-way approx. travel time
  whatsapp_status: string; // customer receipt: sent | failed | not_configured
  status: BookingStatus;
  created_at: string;
}

// POST /api/reviews, GET /api/reviews/all, PATCH /api/reviews/{id} (mirrors Review)
export interface Review {
  id: string;
  booking_id: string;
  display_name: string;
  route: string;
  trip_type: string;
  rating: number;
  comment: string;
  published: boolean;
  created_at: string;
}

// GET /api/reviews (mirrors ReviewsPublic)
export interface ReviewsPublic {
  average: number;
  count: number;
  reviews: Review[];
}
