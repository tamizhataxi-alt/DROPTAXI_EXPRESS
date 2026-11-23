"""Bookings, quotes, service metadata and admin passcode routes — all under /api."""

import logging
import os
import random
from datetime import datetime, timezone

import asyncio

from fastapi import APIRouter, Header, HTTPException, Request
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from lib import data, maps, notify
from lib.admin_guard import check_passcode, require_admin
from lib.dates import today_iso
from lib.db import db
from models.booking import (
    AdminVerifyRequest,
    AdminVerifyResponse,
    Booking,
    BookingCreate,
    BookingStatusUpdate,
    DeleteResponse,
    LeadCreate,
    LeadResponse,
    MetaResponse,
    PlaceSuggestion,
    PopularRoute,
    QuoteOptions,
    QuoteOptionsRequest,
    QuoteRequest,
    QuoteResponse,
    TripDetails,
    VehicleTier,
)

logger = logging.getLogger(__name__)

router = APIRouter()

TOLL_NOTE = "Tolls, state permits & parking charged at actuals"


def _to_booking(doc: dict) -> Booking:
    doc.pop("_id", None)
    created = doc.get("created_at")
    # motor hands back naive datetimes — normalise to aware UTC so Pydantic serialises
    # the offset and `new Date(...)` parses it correctly on the client.
    if isinstance(created, datetime) and created.tzinfo is None:
        doc["created_at"] = created.replace(tzinfo=timezone.utc)
    return Booking(**doc)


@router.get("/meta", response_model=MetaResponse)
async def get_meta():
    return MetaResponse(
        cities=data.CITIES,
        vehicles=[VehicleTier(**v) for v in data.VEHICLE_TIERS],
        routes=[PopularRoute(**r) for r in data.POPULAR_ROUTES],
        hotline=os.environ.get("HOTLINE", "+91 83009 69007"),
        whatsapp_number=os.environ.get("WHATSAPP_NUMBER", "918300969007"),
        email=os.environ.get("CONTACT_EMAIL", "droptaxiexpress.info@gmail.com"),
        address=os.environ.get("OFFICE_ADDRESS", "Chennai - 600062, Tamil Nadu"),
        maps_enabled=maps.maps_enabled(),
        today=today_iso(),
    )


@router.get("/places/autocomplete", response_model=list[PlaceSuggestion])
async def places_autocomplete(q: str = "", session: str = ""):
    return [PlaceSuggestion(**p) for p in await maps.autocomplete(q, session)]


async def _fare(from_label: str, to_label: str, from_pid: str, to_pid: str, vehicle_id: str, trip_type: str, days: int):
    km, duration, known = await maps.trip_distance(from_label, to_label, from_pid, to_pid)
    return km, duration, data.fare_for_distance(from_label, to_label, km, duration, known, vehicle_id, trip_type, days)


@router.post("/quote/options", response_model=QuoteOptions)
async def quote_options(q: QuoteOptionsRequest):
    km, duration, known = await maps.trip_distance(q.from_city, q.to_city, q.from_place_id, q.to_place_id)
    quotes = [
        QuoteResponse(**data.fare_for_distance(q.from_city, q.to_city, km, duration, known, v["id"], q.trip_type, q.days), toll_note=TOLL_NOTE)
        for v in data.VEHICLE_TIERS
    ]
    days = quotes[0].days
    return QuoteOptions(from_city=q.from_city, to_city=q.to_city, road_km=km, duration=duration, trip_type=q.trip_type, days=days, quotes=quotes)


async def _trip_summary(t: TripDetails) -> dict:
    if t.pickup_date < today_iso():
        raise HTTPException(status_code=422, detail="Pickup date cannot be in the past")
    days = t.trip_days()
    km, duration, fare = await _fare(t.pickup_city, t.drop_city, t.pickup_place_id, t.drop_place_id, t.vehicle_id, t.trip_type, days)
    return {**t.model_dump(), "days": days, "road_km": km, "duration": duration, **{
        "vehicle_name": fare["vehicle_name"], "distance_km": fare["distance_km"], "rate_per_km": fare["rate_per_km"],
        "base_fare": fare["base_fare"], "driver_allowance": fare["driver_allowance"], "fare_total": fare["total"],
        "fare_fixed": fare["fixed_price"],
    }}


# Same phone + trip + vehicle within 30 min = one enquiry email (customers flip back and forth).
_LEAD_DEDUPE_SECONDS = 30 * 60


@router.post("/leads", response_model=LeadResponse)
async def create_lead(input: LeadCreate):
    summary = await _trip_summary(input)
    key = "|".join([input.phone, input.pickup_place_id, input.drop_place_id, input.vehicle_id, input.trip_type, input.pickup_date])
    now = datetime.now(timezone.utc)
    recent = await db.leads.find_one({"key": key}, {"_id": 0, "created_at": 1})
    if recent:
        created = recent["created_at"]
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        if (now - created).total_seconds() < _LEAD_DEDUPE_SECONDS:
            return LeadResponse(ok=True, emailed=False)
    emailed = await notify.email_enquiry(summary)
    await db.leads.update_one({"key": key}, {"$set": {"key": key, "created_at": now, "summary": summary, "emailed": emailed}}, upsert=True)
    return LeadResponse(ok=True, emailed=emailed)


@router.post("/quote", response_model=QuoteResponse)
async def create_quote(q: QuoteRequest):
    _, _, fare = await _fare(q.from_city, q.to_city, q.from_place_id, q.to_place_id, q.vehicle_id, q.trip_type, q.days)
    return QuoteResponse(**fare, toll_note=TOLL_NOTE)


async def _notify_booking(booking: Booking, summary: dict) -> None:
    payload = {**summary, "id": booking.id}
    status = await notify.whatsapp_receipt(payload)
    await db.bookings.update_one({"id": booking.id}, {"$set": {"whatsapp_status": status}})
    await notify.email_confirmation({**payload, "whatsapp_status": {
        "sent": "Sent automatically", "failed": "Could not be sent - please message the customer", "not_configured": "Not set up yet",
    }.get(status, status)})


_background: set[asyncio.Task] = set()


@router.post("/bookings", response_model=Booking)
async def create_booking(input: BookingCreate):
    summary = await _trip_summary(input)
    booking = Booking(**{k: v for k, v in summary.items() if k in Booking.model_fields})
    for _ in range(5):  # retry on the rare 5-digit id collision (unique index backs this)
        try:
            await db.bookings.insert_one(booking.model_dump())
            break
        except DuplicateKeyError:
            booking = booking.model_copy(update={"id": f"DTX-{random.randint(10000, 99999)}"})
    else:
        raise HTTPException(status_code=500, detail="Could not allocate a booking id, please retry")
    task = asyncio.create_task(_notify_booking(booking, summary))  # emails/WhatsApp never delay the customer
    _background.add(task)
    task.add_done_callback(_background.discard)
    return booking


@router.get("/bookings", response_model=list[Booking])
async def list_bookings(request: Request, x_admin_key: str = Header(default="")):
    require_admin(x_admin_key, request)
    docs = await db.bookings.find().sort("created_at", -1).to_list(1000)
    return [_to_booking(d) for d in docs]


@router.patch("/bookings/{id}", response_model=Booking)
async def update_booking(id: str, body: BookingStatusUpdate, request: Request, x_admin_key: str = Header(default="")):
    require_admin(x_admin_key, request)
    doc = await db.bookings.find_one_and_update(
        {"id": id},
        {"$set": {"status": body.status}},
        return_document=ReturnDocument.AFTER,
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Booking not found")
    return _to_booking(doc)


@router.delete("/bookings/{id}", response_model=DeleteResponse)
async def delete_booking(id: str, request: Request, x_admin_key: str = Header(default="")):
    require_admin(x_admin_key, request)
    result = await db.bookings.delete_one({"id": id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return DeleteResponse(ok=True, id=id)


@router.post("/admin/verify", response_model=AdminVerifyResponse)
async def verify_admin(body: AdminVerifyRequest, request: Request):
    return AdminVerifyResponse(ok=check_passcode(body.passcode, request))
