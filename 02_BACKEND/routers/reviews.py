"""Customer trip reviews — verified by booking ID + mobile on a completed trip. All under /api."""

from datetime import datetime, timezone

from fastapi import APIRouter, Header, Request, HTTPException
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from lib import data
from lib.db import db
from models.review import Review, ReviewCreate, ReviewPublishUpdate, ReviewsPublic
from lib.admin_guard import require_admin

router = APIRouter()


def _to_review(doc: dict) -> Review:
    doc.pop("_id", None)
    created = doc.get("created_at")
    if isinstance(created, datetime) and created.tzinfo is None:
        doc["created_at"] = created.replace(tzinfo=timezone.utc)
    return Review(**doc)


def display_name(full_name: str) -> str:
    parts = full_name.split()
    if not parts:
        return "Customer"
    return f"{parts[0]} {parts[-1][0]}." if len(parts) > 1 else parts[0]


@router.get("/reviews", response_model=ReviewsPublic)
async def public_reviews():
    stats = await db.reviews.aggregate(
        [{"$match": {"published": True}}, {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}}]
    ).to_list(1)
    docs = await db.reviews.find({"published": True}).sort("created_at", -1).to_list(12)
    avg = round(stats[0]["avg"], 1) if stats else 0.0
    count = stats[0]["count"] if stats else 0
    return ReviewsPublic(average=avg, count=count, reviews=[_to_review(d) for d in docs])


@router.post("/reviews", response_model=Review)
async def create_review(input: ReviewCreate):
    booking = await db.bookings.find_one({"id": input.booking_id, "phone": input.phone})
    if not booking:
        raise HTTPException(status_code=404, detail="No booking found for this booking ID and mobile number")
    if booking.get("status") != "completed":
        raise HTTPException(status_code=422, detail="You can rate your trip once it is completed")
    review = Review(
        booking_id=input.booking_id,
        display_name=display_name(booking.get("customer_name", "")),
        route=f"{data.short_name(booking['pickup_city'])} to {data.short_name(booking['drop_city'])}",
        trip_type=booking.get("trip_type", "one_way"),
        rating=input.rating,
        comment=input.comment.strip(),
    )
    try:
        await db.reviews.insert_one(review.model_dump())
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="This trip has already been reviewed — thank you!")
    return review


@router.get("/reviews/all", response_model=list[Review])
async def all_reviews(request: Request, x_admin_key: str = Header(default="")):
    require_admin(x_admin_key, request)
    docs = await db.reviews.find().sort("created_at", -1).to_list(1000)
    return [_to_review(d) for d in docs]


@router.patch("/reviews/{id}", response_model=Review)
async def set_review_published(id: str, body: ReviewPublishUpdate, request: Request, x_admin_key: str = Header(default="")):
    require_admin(x_admin_key, request)
    doc = await db.reviews.find_one_and_update(
        {"id": id}, {"$set": {"published": body.published}}, return_document=ReturnDocument.AFTER
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Review not found")
    return _to_review(doc)
