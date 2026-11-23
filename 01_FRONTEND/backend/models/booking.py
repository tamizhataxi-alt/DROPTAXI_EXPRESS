"""Pydantic v2 models for quotes, bookings and admin verification."""

import random
import re
import uuid
from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from lib import data

BookingStatus = Literal["new", "confirmed", "completed", "cancelled"]
TripType = Literal["one_way", "round_trip"]

_PHONE_RE = re.compile(r"^[6-9]\d{9}$")


def _normalize_phone(v: str) -> str:
    digits = re.sub(r"\D", "", str(v or ""))
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    if len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    if not _PHONE_RE.match(digits):
        raise ValueError("Enter a valid 10-digit Indian mobile number")
    return digits


class VehicleTier(BaseModel):
    id: str
    name: str
    capacity: str
    rate_per_km: int  # one-way rate
    round_trip_rate: int
    driver_allowance: int  # batta (per day on round trips)
    tag: str
    best_for: str


class PopularRoute(BaseModel):
    from_city: str
    to_city: str
    distance_km: int
    duration: str
    prices: dict[str, int]
    tag: str


class MetaResponse(BaseModel):
    cities: list[str]
    vehicles: list[VehicleTier]
    routes: list[PopularRoute]
    hotline: str
    whatsapp_number: str
    email: str
    address: str
    maps_enabled: bool = False
    today: str  # server-anchored YYYY-MM-DD (APP_TZ) — earliest bookable pickup date


def _check_trip(from_label: str, to_label: str, from_pid: str, to_pid: str) -> tuple[str, str, str, str]:
    """Validate a pickup/drop pair. Without place ids the labels must be our cities (legacy + SEO prefill)."""
    from lib import maps  # local import keeps models free of httpx at import time

    from_label, to_label = (from_label or "").strip(), (to_label or "").strip()
    if not from_pid:
        if from_label not in data.CITIES:
            raise ValueError("Unknown pickup city")
        from_pid = f"{maps.CITY_PREFIX}{from_label}"
    if not to_pid:
        if to_label not in data.CITIES:
            raise ValueError("Unknown drop city")
        to_pid = f"{maps.CITY_PREFIX}{to_label}"
    if not maps.is_valid_place_id(from_pid):
        raise ValueError("Choose the pickup location from the suggestions")
    if not maps.is_valid_place_id(to_pid):
        raise ValueError("Choose the drop location from the suggestions")
    if not (2 <= len(from_label) <= 200) or not (2 <= len(to_label) <= 200):
        raise ValueError("Enter pickup and drop locations")
    if from_pid == to_pid or from_label == to_label:
        raise ValueError("Pickup and drop location must be different")
    return from_label, to_label, from_pid, to_pid


class TripBase(BaseModel):
    from_city: str  # location label (a city name, or the full Google place description)
    to_city: str
    from_place_id: str = ""
    to_place_id: str = ""

    @model_validator(mode="after")
    def check_trip(self):
        self.from_city, self.to_city, self.from_place_id, self.to_place_id = _check_trip(
            self.from_city, self.to_city, self.from_place_id, self.to_place_id
        )
        return self


class RouteBase(TripBase):
    vehicle_id: str

    @model_validator(mode="after")
    def check_vehicle(self):
        if self.vehicle_id not in data.VEHICLES:
            raise ValueError("Unknown vehicle type")
        return self


class QuoteRequest(RouteBase):
    trip_type: TripType = "one_way"
    days: int = Field(default=1, ge=1, le=30)


class QuoteOptionsRequest(TripBase):
    trip_type: TripType = "one_way"
    days: int = Field(default=1, ge=1, le=30)


class QuoteResponse(BaseModel):
    from_city: str
    to_city: str
    vehicle_id: str
    vehicle_name: str
    distance_km: int  # billed km (round trip: both ways / daily minimum)
    duration: str
    rate_per_km: int
    base_fare: int
    driver_allowance: int
    total: int
    fixed_price: bool
    trip_type: TripType = "one_way"
    days: int = 1
    toll_note: str = "Tolls, state permits & parking charged at actuals"


class QuoteOptions(BaseModel):
    from_city: str
    to_city: str
    road_km: int  # one-way road distance
    duration: str  # one-way approx. travel time
    trip_type: TripType
    days: int
    quotes: list[QuoteResponse]


class PlaceSuggestion(BaseModel):
    place_id: str
    main_text: str
    secondary_text: str = ""
    label: str


class TripDetails(BaseModel):
    customer_name: str = Field(min_length=2, max_length=80)
    phone: str
    pickup_city: str
    drop_city: str
    pickup_place_id: str = ""
    drop_place_id: str = ""
    pickup_date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    pickup_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    vehicle_id: str
    trip_type: TripType = "one_way"
    return_date: str = ""

    @field_validator("phone", mode="before")
    @classmethod
    def normalize_phone(cls, v):
        return _normalize_phone(v)

    @model_validator(mode="after")
    def check_route(self):
        self.pickup_city, self.drop_city, self.pickup_place_id, self.drop_place_id = _check_trip(
            self.pickup_city, self.drop_city, self.pickup_place_id, self.drop_place_id
        )
        if self.vehicle_id not in data.VEHICLES:
            raise ValueError("Unknown vehicle type")
        if self.trip_type == "round_trip":
            if not re.match(r"^\d{4}-\d{2}-\d{2}$", self.return_date):
                raise ValueError("Choose a return date for your round trip")
            if self.return_date < self.pickup_date:
                raise ValueError("Return date cannot be before the pickup date")
            if self.trip_days() > 30:
                raise ValueError("Round trips can be up to 30 days")
        else:
            self.return_date = ""
        return self

    def trip_days(self) -> int:
        if self.trip_type != "round_trip":
            return 1
        start = datetime.strptime(self.pickup_date, "%Y-%m-%d")
        end = datetime.strptime(self.return_date, "%Y-%m-%d")
        return (end - start).days + 1


class LeadCreate(TripDetails):
    """Sent when the customer picks a vehicle — emails the owner a booking enquiry."""


class LeadResponse(BaseModel):
    ok: bool
    emailed: bool


class BookingCreate(TripDetails):
    pickup_address: str = Field(min_length=4, max_length=200)
    drop_address: str = Field(min_length=4, max_length=200)
    notes: str = Field(default="", max_length=300)


class Booking(BaseModel):
    id: str = Field(default_factory=lambda: f"DTX-{random.randint(10000, 99999)}")
    customer_name: str
    phone: str
    pickup_city: str
    drop_city: str
    pickup_address: str
    drop_address: str
    pickup_date: str
    pickup_time: str
    vehicle_id: str
    vehicle_name: str
    notes: str = ""
    distance_km: int
    fare_total: int
    fare_fixed: bool
    trip_type: TripType = "one_way"
    return_date: str = ""
    days: int = 1
    pickup_place_id: str = ""
    drop_place_id: str = ""
    road_km: int = 0  # one-way road distance
    duration: str = ""  # one-way approx. travel time
    whatsapp_status: str = ""  # customer receipt: sent | failed | not_configured
    status: BookingStatus = "new"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BookingStatusUpdate(BaseModel):
    status: BookingStatus


class AdminVerifyRequest(BaseModel):
    passcode: str


class AdminVerifyResponse(BaseModel):
    ok: bool


class DeleteResponse(BaseModel):
    ok: bool
    id: str


class EnquiryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    phone: str
    email: str = Field(default="", max_length=120)
    message: str = Field(min_length=5, max_length=1000)

    @field_validator("phone", mode="before")
    @classmethod
    def normalize_phone(cls, v):
        return _normalize_phone(v)


class Enquiry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: str = ""
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
