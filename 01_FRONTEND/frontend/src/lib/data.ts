// Static service content mirrored from backend/lib/data.py — rendered instantly and used for
// client-side fare estimates. The backend recomputes the authoritative fare at booking time.
import type { PopularRoute, Quote, TripType, VehicleTier } from "@/lib/types";

const CITY_COORDS: Record<string, [number, number]> = {
  Chennai: [13.0827, 80.2707],
  Bangalore: [12.9716, 77.5946],
  Coimbatore: [11.0168, 76.9558],
  Madurai: [9.9252, 78.1198],
  Salem: [11.6643, 78.1462],
  "Trichy (Tiruchirappalli)": [10.7905, 78.7047],
  Tirunelveli: [8.7139, 77.7567],
  Vellore: [12.9165, 79.1325],
  Erode: [11.341, 77.7172],
  Thanjavur: [10.787, 79.1378],
  "Pondicherry (Puducherry)": [11.9416, 79.8083],
  Hosur: [12.7409, 77.8253],
  Dindigul: [10.3673, 77.9803],
  Nagercoil: [8.178, 77.428],
  Tiruppur: [11.1085, 77.3411],
  "Tuticorin (Thoothukudi)": [8.7642, 78.1348],
  Kanchipuram: [12.8342, 79.7036],
  Kumbakonam: [10.9601, 79.3845],
  Ooty: [11.4102, 76.695],
  Kodaikanal: [10.2381, 77.4892],
  Yercaud: [11.7753, 78.2093],
  Rameswaram: [9.2876, 79.3129],
  Kanyakumari: [8.0883, 77.5385],
  Mahabalipuram: [12.6208, 80.1945],
  Velankanni: [10.6826, 79.8424],
  Tiruvannamalai: [12.2253, 79.0747],
  Chidambaram: [11.3993, 79.6936],
  Cuddalore: [11.748, 79.7714],
  Karaikudi: [10.0763, 78.7803],
  Karur: [10.9601, 78.0766],
  Namakkal: [11.2189, 78.1674],
  Krishnagiri: [12.5266, 78.215],
  Pollachi: [10.6609, 77.0048],
  Palani: [10.45, 77.52],
  Nagapattinam: [10.7672, 79.8449],
  Tiruchendur: [8.4946, 78.1213],
};

export const CITIES: string[] = Object.keys(CITY_COORDS);
export const HILL_STATIONS = new Set(["Ooty", "Kodaikanal", "Yercaud"]);
export const HUBS = ["Chennai", "Bangalore", "Pondicherry (Puducherry)", "Coimbatore", "Madurai", "Trichy (Tiruchirappalli)"];

export const ONE_WAY_MIN_KM = 130;
export const ROUND_TRIP_MIN_KM_PER_DAY = 250;

export const VEHICLE_TIERS: VehicleTier[] = [
  { id: "sedan", name: "Sedan (Dzire / Amaze / Aura)", capacity: "4 Passengers + Driver", rate_per_km: 15, round_trip_rate: 14, driver_allowance: 400, tag: "Most Booked", best_for: "Families & business travel" },
  { id: "etios", name: "Etios (Only Toyota Etios)", capacity: "4 Passengers + Driver", rate_per_km: 15, round_trip_rate: 14, driver_allowance: 400, tag: "Only Etios", best_for: "Extra legroom & boot space" },
  { id: "suv", name: "SUV (Tavera / Xylo / Lodgy)", capacity: "7 Passengers + Driver", rate_per_km: 20, round_trip_rate: 19, driver_allowance: 500, tag: "Group Travel", best_for: "Big families & temple trips" },
  { id: "innova", name: "Innova (Toyota Innova)", capacity: "7 Passengers + Driver", rate_per_km: 20, round_trip_rate: 19, driver_allowance: 500, tag: "Comfort MUV", best_for: "Long highway journeys" },
  { id: "innova_crysta", name: "Innova Crysta (Premium MUV)", capacity: "7 Passengers + Driver", rate_per_km: 23, round_trip_rate: 22, driver_allowance: 500, tag: "Premium", best_for: "VIP & executive travel" },
];

export const VEHICLES: Record<string, VehicleTier> = Object.fromEntries(VEHICLE_TIERS.map((v) => [v.id, v]));

const oneWayTotal = (km: number, v: VehicleTier) => Math.max(km, ONE_WAY_MIN_KM) * v.rate_per_km + v.driver_allowance;

const ROUTE_BASE = [
  { from_city: "Bangalore", to_city: "Chennai", distance_km: 350, duration: "6 hrs", tag: "Top Corridor" },
  { from_city: "Chennai", to_city: "Bangalore", distance_km: 350, duration: "6 hrs", tag: "Top Corridor" },
  { from_city: "Chennai", to_city: "Pondicherry (Puducherry)", distance_km: 150, duration: "3 hrs", tag: "Weekend Getaway" },
  { from_city: "Chennai", to_city: "Coimbatore", distance_km: 500, duration: "8.5 hrs", tag: "Industrial Hub" },
  { from_city: "Bangalore", to_city: "Coimbatore", distance_km: 365, duration: "6.5 hrs", tag: "Direct Highway" },
  { from_city: "Chennai", to_city: "Madurai", distance_km: 460, duration: "8 hrs", tag: "Temple City" },
  { from_city: "Chennai", to_city: "Trichy (Tiruchirappalli)", distance_km: 330, duration: "5.5 hrs", tag: "Rock Fort City" },
  { from_city: "Bangalore", to_city: "Pondicherry (Puducherry)", distance_km: 310, duration: "6 hrs", tag: "Beach Escape" },
  { from_city: "Bangalore", to_city: "Madurai", distance_km: 435, duration: "7.5 hrs", tag: "Heritage Express" },
];

export const POPULAR_ROUTES: PopularRoute[] = ROUTE_BASE.map((r) => ({
  ...r,
  prices: Object.fromEntries(VEHICLE_TIERS.map((v) => [v.id, oneWayTotal(r.distance_km, v)])),
}));

export const TOLL_NOTE = "Tolls, state permits & parking charged at actuals";

// Contact details — overridden by GET /api/meta (backend/.env) when the backend is reachable.
export const HOTLINE_FALLBACK = "+91 83009 69007";
export const WHATSAPP_FALLBACK = "918300969007";
export const EMAIL_FALLBACK = "droptaxiexpress.info@gmail.com";
export const ADDRESS_FALLBACK = "Chennai - 600062, Tamil Nadu";

export function contactInfo(meta?: { hotline: string; whatsapp_number: string; email: string; address?: string }) {
  const hotline = meta?.hotline ?? HOTLINE_FALLBACK;
  return {
    hotline,
    tel: `tel:${hotline.replace(/\s/g, "")}`,
    whatsapp: meta?.whatsapp_number ?? WHATSAPP_FALLBACK,
    email: meta?.email ?? EMAIL_FALLBACK,
    address: meta?.address ?? ADDRESS_FALLBACK,
  };
}

// 30-minute pickup slots: value "HH:MM", label "h:mm AM".
export const TIME_SLOTS: { value: string; label: string }[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { value: `${String(h).padStart(2, "0")}:${m}`, label: `${h12}:${m} ${h < 12 ? "AM" : "PM"}` };
});

export function shortName(city: string): string {
  return city.split(" (")[0];
}

export function estimateDistanceKm(fromCity: string, toCity: string): number {
  const a = CITY_COORDS[fromCity];
  const b = CITY_COORDS[toCity];
  if (!a || !b) return 0;
  const rad = Math.PI / 180;
  const dPhi = (b[0] - a[0]) * rad;
  const dLmb = (b[1] - a[1]) * rad;
  const h = Math.sin(dPhi / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLmb / 2) ** 2;
  const greatCircleKm = 2 * Math.asin(Math.sqrt(h)) * 6371.0;
  return Math.max(40, Math.round((greatCircleKm * 1.2) / 5) * 5);
}

export function findRoute(fromCity: string, toCity: string): PopularRoute | undefined {
  return POPULAR_ROUTES.find(
    (r) => (r.from_city === fromCity && r.to_city === toCity) || (r.from_city === toCity && r.to_city === fromCity),
  );
}

// "/routes/chennai-to-bangalore" slugs for the SEO route pages.
export function routeSlug(fromCity: string, toCity: string): string {
  return `${shortName(fromCity)}-to-${shortName(toCity)}`.toLowerCase();
}

// Inclusive day count between two YYYY-MM-DD dates (min 1).
export function tripDays(startIso: string, endIso: string): number {
  if (!startIso || !endIso) return 1;
  const ms = Date.parse(`${endIso}T00:00:00Z`) - Date.parse(`${startIso}T00:00:00Z`);
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

// Mirror of backend quote_fare. One way: max(km, 130) x one-way rate + batta.
// Round trip: max(km x 2, 250 x days) x round-trip rate + batta x days.
export function quoteFare(fromCity: string, toCity: string, vehicleId: string, tripType: TripType = "one_way", days = 1): Quote | null {
  const vehicle = VEHICLES[vehicleId];
  if (!vehicle || !fromCity || !toCity || fromCity === toCity) return null;
  const route = findRoute(fromCity, toCity);
  const distance = route ? route.distance_km : estimateDistanceKm(fromCity, toCity);
  const round = tripType === "round_trip";
  const d = round ? Math.max(1, days) : 1;
  const billed = round ? Math.max(distance * 2, ROUND_TRIP_MIN_KM_PER_DAY * d) : Math.max(distance, ONE_WAY_MIN_KM);
  const rate = round ? vehicle.round_trip_rate : vehicle.rate_per_km;
  const allowance = vehicle.driver_allowance * d;
  const baseFare = billed * rate;
  return {
    from_city: fromCity,
    to_city: toCity,
    vehicle_id: vehicleId,
    vehicle_name: vehicle.name,
    distance_km: billed,
    duration: round ? `${d} day${d > 1 ? "s" : ""}` : route ? route.duration : `~${Math.max(1, Math.round(distance / 50))} hrs`,
    rate_per_km: rate,
    base_fare: baseFare,
    driver_allowance: allowance,
    total: baseFare + allowance,
    fixed_price: !!route,
    trip_type: tripType,
    days: d,
    toll_note: TOLL_NOTE,
  };
}

// Mirrors backend seo_route_pairs(): popular lanes + every city to/from each hub.
export const SEO_PAIRS: [string, string][] = (() => {
  const seen = new Set<string>();
  const out: [string, string][] = [];
  const all: [string, string][] = [
    ...POPULAR_ROUTES.map((r) => [r.from_city, r.to_city] as [string, string]),
    ...HUBS.flatMap((hub) => CITIES.filter((c) => c !== hub).flatMap((c) => [[hub, c], [c, hub]] as [string, string][])),
  ];
  for (const p of all) {
    const k = p.join("|");
    if (!seen.has(k)) {
      seen.add(k);
      out.push(p);
    }
  }
  return out;
})();

export interface RouteInfo {
  from_city: string;
  to_city: string;
  distance_km: number;
  duration: string;
  prices: Record<string, number>;
  fixed: boolean;
}

export function routeInfo(fromCity: string, toCity: string): RouteInfo | null {
  const first = quoteFare(fromCity, toCity, VEHICLE_TIERS[0].id);
  if (!first) return null;
  const route = findRoute(fromCity, toCity);
  return {
    from_city: fromCity,
    to_city: toCity,
    distance_km: route ? route.distance_km : estimateDistanceKm(fromCity, toCity),
    duration: first.duration,
    prices: Object.fromEntries(VEHICLE_TIERS.map((v) => [v.id, quoteFare(fromCity, toCity, v.id)?.total ?? 0])),
    fixed: first.fixed_price,
  };
}

// Any pair of our cities: "/routes/madurai-to-chennai" -> RouteInfo.
export function routeInfoFromSlug(slug: string): RouteInfo | null {
  const [a, b] = slug.split("-to-");
  if (!a || !b) return null;
  const find = (s: string) => CITIES.find((c) => shortName(c).toLowerCase() === s);
  const from = find(a);
  const to = find(b);
  return from && to ? routeInfo(from, to) : null;
}
