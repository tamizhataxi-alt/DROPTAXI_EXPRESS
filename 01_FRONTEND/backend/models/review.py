"""Pydantic v2 models for customer trip reviews."""

import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, Field, field_validator

from models.booking import _normalize_phone


class ReviewCreate(BaseModel):
    booking_id: str = Field(min_length=5, max_length=20)
    phone: str
    rating: int = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=500)

    @field_validator("booking_id", mode="before")
    @classmethod
    def normalize_booking_id(cls, v):
        return str(v or "").strip().upper()

    @field_validator("phone", mode="before")
    @classmethod
    def normalize_phone(cls, v):
        return _normalize_phone(v)


class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    display_name: str  # "Arun P." — never the full name or phone
    route: str  # "Bangalore to Chennai"
    trip_type: str = "one_way"
    rating: int
    comment: str = ""
    published: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReviewsPublic(BaseModel):
    average: float
    count: int
    reviews: list[Review]


class ReviewPublishUpdate(BaseModel):
    published: bool
