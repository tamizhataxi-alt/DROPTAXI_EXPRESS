"""Static service configuration: cities, coordinates, vehicle tiers, popular routes, fare engine.

This is the single source of truth for fares on the backend. The frontend mirrors
this content in `frontend/src/lib/data.ts` for instant client-side estimates and
static rendering — the backend recomputes the authoritative fare when a booking
is created (server always wins).
"""

import math

CITIES: list[str] = [
    "Chennai",
    "Bangalore",
    "Coimbatore",
    "Madurai",
    "Salem",
    "Trichy (Tiruchirappalli)",
    "Tirunelveli",
    "Vellore",
    "Erode",
    "Thanjavur",
    "Pondicherry (Puducherry)",
    "Hosur",
    "Dindigul",
    "Nagercoil",
    "Tiruppur",
    "Tuticorin (Thoothukudi)",
    "Kanchipuram",
    "Kumbakonam",
    "Ooty",
    "Kodaikanal",
    "Yercaud",
    "Rameswaram",
    "Kanyakumari",
    "Mahabalipuram",
    "Velankanni",
    "Tiruvannamalai",
    "Chidambaram",
    "Cuddalore",
    "Karaikudi",
    "Karur",
    "Namakkal",
    "Krishnagiri",
    "Pollachi",
    "Palani",
    "Nagapattinam",
    "Tiruchendur",
]

CITY_COORDS: dict[str, tuple[float, float]] = {
    "Chennai": (13.0827, 80.2707),
    "Bangalore": (12.9716, 77.5946),
    "Coimbatore": (11.0168, 76.9558),
    "Madurai": (9.9252, 78.1198),
    "Salem": (11.6643, 78.1462),
    "Trichy (Tiruchirappalli)": (10.7905, 78.7047),
    "Tirunelveli": (8.7139, 77.7567),
    "Vellore": (12.9165, 79.1325),
    "Erode": (11.3410, 77.7172),
    "Thanjavur": (10.7870, 79.1378),
    "Pondicherry (Puducherry)": (11.9416, 79.8083),
    "Hosur": (12.7409, 77.8253),
    "Dindigul": (10.3673, 77.9803),
    "Nagercoil": (8.1780, 77.4280),
    "Tiruppur": (11.1085, 77.3411),
    "Tuticorin (Thoothukudi)": (8.7642, 78.1348),
    "Kanchipuram": (12.8342, 79.7036),
    "Kumbakonam": (10.9601, 79.3845),
    "Ooty": (11.4102, 76.6950),
    "Kodaikanal": (10.2381, 77.4892),
    "Yercaud": (11.7753, 78.2093),
    "Rameswaram": (9.2876, 79.3129),
    "Kanyakumari": (8.0883, 77.5385),
    "Mahabalipuram": (12.6208, 80.1945),
    "Velankanni": (10.6826, 79.8424),
    "Tiruvannamalai": (12.2253, 79.0747),
    "Chidambaram": (11.3993, 79.6936),
    "Cuddalore": (11.7480, 79.7714),
    "Karaikudi": (10.0763, 78.7803),
    "Karur": (10.9601, 78.0766),
    "Namakkal": (11.2189, 78.1674),
    "Krishnagiri": (12.5266, 78.2150),
    "Pollachi": (10.6609, 77.0048),
    "Palani": (10.4500, 77.5200),
    "Nagapattinam": (10.7672, 79.8449),
    "Tiruchendur": (8.4946, 78.1213),
}

VEHICLE_TIERS: list[dict] = [
    {"id": "sedan", "name": "Sedan (Dzire / Amaze / Aura)", "capacity": "4 Passengers + Driver", "rate_per_km": 15, "round_trip_rate": 14, "driver_allowance": 400, "tag": "Most Booked", "best_for": "Families & business travel"},
    {"id": "etios", "name": "Etios (Only Toyota Etios)", "capacity": "4 Passengers + Driver", "rate_per_km": 15, "round_trip_rate": 14, "driver_allowance": 400, "tag": "Only Etios", "best_for": "Extra legroom & boot space"},
    {"id": "suv", "name": "SUV (Tavera / Xylo / Lodgy)", "capacity": "7 Passengers + Driver", "rate_per_km": 20, "round_trip_rate": 19, "driver_allowance": 500, "tag": "Group Travel", "best_for": "Big families & temple trips"},
    {"id": "innova", "name": "Innova (Toyota Innova)", "capacity": "7 Passengers + Driver", "rate_per_km": 20, "round_trip_rate": 19, "driver_allowance": 500, "tag": "Comfort MUV", "best_for": "Long highway journeys"},
    {"id": "innova_crysta", "name": "Innova Crysta (Premium MUV)", "capacity": "7 Passengers + Driver", "rate_per_km": 23, "round_trip_rate": 22, "driver_allowance": 500, "tag": "Premium", "best_for": "VIP & executive travel"},
]

VEHICLES: dict[str, dict] = {v["id"]: v for v in VEHICLE_TIERS}

ONE_WAY_MIN_KM = 130
ROUND_TRIP_MIN_KM_PER_DAY = 250

# Known road distances for the busiest lanes (fares are always rate-card based).
POPULAR_ROUTES: list[dict] = [
    {"from_city": "Bangalore", "to_city": "Chennai", "distance_km": 350, "duration": "6 hrs", "tag": "Top Corridor"},
    {"from_city": "Chennai", "to_city": "Bangalore", "distance_km": 350, "duration": "6 hrs", "tag": "Top Corridor"},
    {"from_city": "Chennai", "to_city": "Pondicherry (Puducherry)", "distance_km": 150, "duration": "3 hrs", "tag": "Weekend Getaway"},
    {"from_city": "Chennai", "to_city": "Coimbatore", "distance_km": 500, "duration": "8.5 hrs", "tag": "Industrial Hub"},
    {"from_city": "Bangalore", "to_city": "Coimbatore", "distance_km": 365, "duration": "6.5 hrs", "tag": "Direct Highway"},
    {"from_city": "Chennai", "to_city": "Madurai", "distance_km": 460, "duration": "8 hrs", "tag": "Temple City"},
    {"from_city": "Chennai", "to_city": "Trichy (Tiruchirappalli)", "distance_km": 330, "duration": "5.5 hrs", "tag": "Rock Fort City"},
    {"from_city": "Bangalore", "to_city": "Pondicherry (Puducherry)", "distance_km": 310, "duration": "6 hrs", "tag": "Beach Escape"},
    {"from_city": "Bangalore", "to_city": "Madurai", "distance_km": 435, "duration": "7.5 hrs", "tag": "Heritage Express"},
]


def _fill_route_prices() -> None:
    for r in POPULAR_ROUTES:
        r["prices"] = {
            v["id"]: max(r["distance_km"], ONE_WAY_MIN_KM) * v["rate_per_km"] + v["driver_allowance"]
            for v in VEHICLE_TIERS
        }


_fill_route_prices()


def _route_key(a: str, b: str) -> tuple[str, str]:
    return (a, b) if a <= b else (b, a)


FIXED_ROUTES: dict[tuple[str, str], dict] = {
    _route_key(r["from_city"], r["to_city"]): r for r in POPULAR_ROUTES
}


def short_name(city: str) -> str:
    """'Trichy (Tiruchirappalli)' -> 'Trichy' for compact display."""
    return city.split(" (")[0]


def estimate_distance_km(from_city: str, to_city: str) -> int:
    """Road distance estimate: haversine great-circle km x 1.2 road factor, rounded to 5 km."""
    (lat1, lon1), (lat2, lon2) = CITY_COORDS[from_city], CITY_COORDS[to_city]
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlmb / 2) ** 2
    hav = 2 * math.asin(math.sqrt(a)) * 6371.0
    road_km = hav * 1.2
    return max(40, int(round(road_km / 5.0) * 5))


def quote_fare(from_city: str, to_city: str, vehicle_id: str, trip_type: str = "one_way", days: int = 1) -> dict:
    """City-to-city fare (distance from the known-route table or estimate)."""
    distance = one_way_distance_km(from_city, to_city)
    route = FIXED_ROUTES.get(_route_key(from_city, to_city))
    duration = route["duration"] if route else f"~{max(1, round(distance / 50))} hrs"
    return fare_for_distance(from_city, to_city, distance, duration, route is not None, vehicle_id, trip_type, days)


def fare_for_distance(
    from_label: str,
    to_label: str,
    distance: int,
    one_way_duration: str,
    known: bool,
    vehicle_id: str,
    trip_type: str = "one_way",
    days: int = 1,
) -> dict:
    """Authoritative fare from the rate card for a one-way road distance.
    One way: max(km, 130) x one-way rate + driver batta.
    Round trip: max(km x 2, 250 x days) x round-trip rate + batta x days."""
    vehicle = VEHICLES[vehicle_id]
    if trip_type == "round_trip":
        days = max(1, days)
        billed = max(distance * 2, ROUND_TRIP_MIN_KM_PER_DAY * days)
        rate, allowance = vehicle["round_trip_rate"], vehicle["driver_allowance"] * days
        duration = f"{days} day{'s' if days > 1 else ''}"
    else:
        days = 1
        billed = max(distance, ONE_WAY_MIN_KM)
        rate, allowance = vehicle["rate_per_km"], vehicle["driver_allowance"]
        duration = one_way_duration
    base = billed * rate
    return {
        "from_city": from_label,
        "to_city": to_label,
        "vehicle_id": vehicle_id,
        "vehicle_name": vehicle["name"],
        "distance_km": billed,
        "duration": duration,
        "rate_per_km": rate,
        "base_fare": base,
        "driver_allowance": allowance,
        "total": base + allowance,
        "fixed_price": known,
        "trip_type": trip_type,
        "days": days,
    }


def one_way_distance_km(from_city: str, to_city: str) -> int:
    route = FIXED_ROUTES.get(_route_key(from_city, to_city))
    return int(route["distance_km"]) if route else estimate_distance_km(from_city, to_city)


# SEO route pages: every city to/from each hub (Chennai, Bangalore, Pondicherry, Coimbatore, Madurai, Trichy).
HUBS: list[str] = ["Chennai", "Bangalore", "Pondicherry (Puducherry)", "Coimbatore", "Madurai", "Trichy (Tiruchirappalli)"]


def seo_route_pairs() -> list[tuple[str, str]]:
    seen: set[tuple[str, str]] = set()
    pairs: list[tuple[str, str]] = []
    for pair in [(r["from_city"], r["to_city"]) for r in POPULAR_ROUTES] + [
        p for hub in HUBS for c in CITIES if c != hub for p in ((hub, c), (c, hub))
    ]:
        if pair not in seen:
            seen.add(pair)
            pairs.append(pair)
    return pairs


def route_slug(from_city: str, to_city: str) -> str:
    return f"{short_name(from_city)}-to-{short_name(to_city)}".lower()


def sitemap_route_pairs() -> list[tuple[str, str]]:
    return seo_route_pairs()
