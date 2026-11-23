"""Seed sample bookings so the admin portal has data on first run.

Idempotent: bookings skip when the collection is non-empty; the sample review skips if present. Not imported by server.py.
Run: cd /app/backend && python seed.py
"""

import asyncio
import uuid
from datetime import datetime, timedelta, timezone

from lib import data
from lib.db import db, ensure_indexes

SAMPLES = [
    {
        "id": "DTX-77001",
        "customer_name": "Ramesh Kumar",
        "phone": "9840012345",
        "pickup_city": "Chennai",
        "drop_city": "Bangalore",
        "pickup_address": "12, T Nagar Main Road, Chennai",
        "drop_address": "Indiranagar 100ft Road, Bangalore",
        "pickup_date": "2026-03-14",
        "pickup_time": "06:30",
        "vehicle_id": "sedan",
        "status": "new",
        "notes": "Morning pickup, luggage: 2 suitcases",
    },
    {
        "id": "DTX-77002",
        "customer_name": "Priya Sundaram",
        "phone": "9884766550",
        "pickup_city": "Coimbatore",
        "drop_city": "Madurai",
        "pickup_address": "Avinashi Road, Near Hope College, Coimbatore",
        "drop_address": "KK Nagar, Madurai",
        "pickup_date": "2026-03-15",
        "pickup_time": "14:00",
        "vehicle_id": "suv",
        "status": "confirmed",
        "notes": "Family of 5, temple trip",
    },
    {
        "id": "DTX-77003",
        "customer_name": "Arun Prakash",
        "phone": "9962557890",
        "pickup_city": "Bangalore",
        "drop_city": "Chennai",
        "pickup_address": "Koramangala 5th Block, Bangalore",
        "drop_address": "OMR Sholinganallur, Chennai",
        "pickup_date": "2026-03-12",
        "pickup_time": "22:00",
        "vehicle_id": "etios",
        "status": "completed",
        "notes": "Night drop, done on time",
    },
]


async def seed_reviews() -> None:
    """One SAMPLE review on the seeded completed booking DTX-77003 (idempotent)."""
    if await db.reviews.count_documents({"booking_id": "DTX-77003"}) > 0:
        return
    if not await db.bookings.find_one({"id": "DTX-77003", "status": "completed"}):
        return
    await db.reviews.insert_one({
        "id": str(uuid.uuid4()),
        "booking_id": "DTX-77003",
        "display_name": "Arun P.",
        "route": "Bangalore to Chennai",
        "trip_type": "one_way",
        "rating": 5,
        "comment": "Night drop from Koramangala to OMR — driver was on time, car was clean and the fare matched the quote exactly.",
        "published": True,
        "created_at": datetime.now(timezone.utc) - timedelta(hours=3),
    })
    print("seeded sample review for DTX-77003")


async def main() -> None:
    await ensure_indexes()
    await seed_reviews()
    if await db.bookings.count_documents({}) > 0:
        print("bookings already present — skipping seed")
        return
    for i, sample in enumerate(SAMPLES):
        fare = data.quote_fare(sample["pickup_city"], sample["drop_city"], sample["vehicle_id"])
        doc = {
            **sample,
            "vehicle_name": data.VEHICLES[sample["vehicle_id"]]["name"],
            "distance_km": fare["distance_km"],
            "fare_total": fare["total"],
            "fare_fixed": fare["fixed_price"],
            "notes": sample.get("notes", ""),
            "created_at": datetime.now(timezone.utc) - timedelta(hours=7 * (i + 1)),
        }
        await db.bookings.insert_one(doc)
        print(f"seeded {doc['id']}: {doc['customer_name']} {doc['pickup_city']} -> {doc['drop_city']} (fare {fare['total']})")


asyncio.run(main())
