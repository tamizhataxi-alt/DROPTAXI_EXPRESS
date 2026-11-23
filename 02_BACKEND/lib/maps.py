"""Location search + road distance.

With GOOGLE_MAPS_API_KEY set: Google Places (New) autocomplete + Routes API driving distance, server-side
so the key never reaches the browser. Without it: suggestions come from our own city list and distances
from the city table, so the booking form keeps working.

Place ids: "city:<City Name>" for our city list, otherwise a Google place id.
"""

import logging
import os
import re

import httpx
from fastapi import HTTPException

from lib import data

logger = logging.getLogger(__name__)

CITY_PREFIX = "city:"
GOOGLE_ID_RE = re.compile(r"^[A-Za-z0-9_-]{10,300}$")

# Tamil Nadu, Puducherry and Karnataka (with a little margin).
SERVICE_AREA = {"low": {"latitude": 7.9, "longitude": 74.0}, "high": {"latitude": 18.5, "longitude": 80.6}}

_distance_cache: dict[tuple[str, str], tuple[int, str]] = {}


def maps_key() -> str:
    return os.environ.get("GOOGLE_MAPS_API_KEY", "").strip()


def maps_enabled() -> bool:
    return bool(maps_key())


def is_valid_place_id(pid: str) -> bool:
    if pid.startswith(CITY_PREFIX):
        return pid[len(CITY_PREFIX):] in data.CITIES
    return GOOGLE_ID_RE.match(pid) is not None


def _city_suggestions(q: str) -> list[dict]:
    ql = q.strip().lower()
    hits = [c for c in data.CITIES if ql in c.lower()] if ql else list(data.CITIES)
    hits.sort(key=lambda c: (not c.lower().startswith(ql), c))
    return [
        {"place_id": f"{CITY_PREFIX}{c}", "main_text": c, "secondary_text": "Tamil Nadu · Pondicherry · Bangalore", "label": c}
        for c in hits[:8]
    ]


async def autocomplete(q: str, session: str = "") -> list[dict]:
    q = q.strip()[:120]
    if not maps_enabled() or len(q) < 2:
        return _city_suggestions(q)
    body: dict = {
        "input": q,
        "includedRegionCodes": ["in"],
        "locationRestriction": {"rectangle": SERVICE_AREA},
        "languageCode": "en",
    }
    if session:
        body["sessionToken"] = session[:64]
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.post(
                "https://places.googleapis.com/v1/places:autocomplete",
                headers={"X-Goog-Api-Key": maps_key()},
                json=body,
            )
        resp.raise_for_status()
    except httpx.HTTPError as e:
        detail = getattr(getattr(e, "response", None), "text", "")[:300]
        logger.warning("Places autocomplete failed: %s %s", e, detail)
        return _city_suggestions(q)
    out = []
    for s in resp.json().get("suggestions", []):
        p = s.get("placePrediction")
        if not p:
            continue
        fmt = p.get("structuredFormat", {})
        main = fmt.get("mainText", {}).get("text") or p.get("text", {}).get("text", "")
        out.append({
            "place_id": p["placeId"],
            "main_text": main,
            "secondary_text": fmt.get("secondaryText", {}).get("text", ""),
            "label": p.get("text", {}).get("text", main),
        })
    return out or _city_suggestions(q)


def _waypoint(pid: str, label: str) -> dict:
    if pid.startswith(CITY_PREFIX):
        return {"address": f"{pid[len(CITY_PREFIX):]}, India"}
    return {"placeId": pid}


def _fmt_duration(seconds: int) -> str:
    hours = seconds / 3600
    if hours < 1:
        return f"~{max(10, round(seconds / 60))} mins"
    return f"~{round(hours * 2) / 2:g} hrs"


async def _google_distance(from_pid: str, from_label: str, to_pid: str, to_label: str) -> tuple[int, str]:
    key = (from_pid, to_pid)
    if key in _distance_cache:
        return _distance_cache[key]
    body = {
        "origin": _waypoint(from_pid, from_label),
        "destination": _waypoint(to_pid, to_label),
        "travelMode": "DRIVE",
        "routingPreference": "TRAFFIC_UNAWARE",
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                "https://routes.googleapis.com/directions/v2:computeRoutes",
                headers={"X-Goog-Api-Key": maps_key(), "X-Goog-FieldMask": "routes.distanceMeters,routes.duration"},
                json=body,
            )
        resp.raise_for_status()
        routes = resp.json().get("routes") or []
    except httpx.HTTPError as e:
        detail = getattr(getattr(e, "response", None), "text", "")[:300]
        logger.warning("Routes API failed: %s %s", e, detail)
        raise HTTPException(status_code=503, detail="Could not calculate the road distance right now. Please call us.")
    if not routes or "distanceMeters" not in routes[0]:
        raise HTTPException(status_code=422, detail="No driving route found between these locations")
    km = max(1, round(routes[0]["distanceMeters"] / 1000))
    seconds = int(str(routes[0].get("duration", "0s")).rstrip("s") or 0)
    result = (km, _fmt_duration(seconds))
    _distance_cache[key] = result
    return result


async def trip_distance(from_label: str, to_label: str, from_pid: str, to_pid: str) -> tuple[int, str, bool]:
    """(one-way road km, duration text, known_route) for a pickup/drop pair."""
    if from_pid == to_pid:
        raise HTTPException(status_code=422, detail="Pickup and drop location must be different")
    both_cities = from_pid.startswith(CITY_PREFIX) and to_pid.startswith(CITY_PREFIX)
    if both_cities:
        a, b = from_pid[len(CITY_PREFIX):], to_pid[len(CITY_PREFIX):]
        route = data.FIXED_ROUTES.get(data._route_key(a, b))
        if route or not maps_enabled():
            km = data.one_way_distance_km(a, b)
            return km, route["duration"] if route else f"~{max(1, round(km / 50))} hrs", route is not None
    if not maps_enabled():
        raise HTTPException(status_code=422, detail="Choose pickup and drop from the suggestions")
    km, duration = await _google_distance(from_pid, from_label, to_pid, to_label)
    return km, duration, False
