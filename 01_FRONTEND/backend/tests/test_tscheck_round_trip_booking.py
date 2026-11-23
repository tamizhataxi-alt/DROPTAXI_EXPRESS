"""Round trip booking + booking confirmation (DTX id, distance, whatsapp_status).

billed km = max(2 x road_km, 250 x days); booking succeeds and whatsapp_status becomes
'not_configured' (no WhatsApp provider configured in this environment) once the background
notify task runs.
"""

import time


def test_round_trip_booking_billed_km_and_confirmation(client):
    quote = client.post(
        "/quote/options",
        json={
            "from_city": "Chennai",
            "to_city": "Pondicherry (Puducherry)",
            "from_place_id": "city:Chennai",
            "to_place_id": "city:Pondicherry (Puducherry)",
            "trip_type": "round_trip",
            "days": 2,
        },
    )
    assert quote.status_code == 200, quote.text
    qbody = quote.json()
    road_km = qbody["road_km"]
    expected_billed = max(road_km * 2, 250 * 2)
    sedan_quote = next(q for q in qbody["quotes"] if q["vehicle_id"] == "sedan")
    assert sedan_quote["distance_km"] == expected_billed

    resp = client.post(
        "/bookings",
        json={
            "customer_name": "TEST_tscheck_roundtrip",
            "phone": "9822233300",
            "pickup_city": "Chennai",
            "drop_city": "Pondicherry (Puducherry)",
            "pickup_place_id": "city:Chennai",
            "drop_place_id": "city:Pondicherry (Puducherry)",
            "pickup_date": "2027-02-10",
            "return_date": "2027-02-11",
            "pickup_time": "09:00",
            "vehicle_id": "sedan",
            "trip_type": "round_trip",
            "pickup_address": "tscheck pickup address, Chennai",
            "drop_address": "tscheck drop address, Pondicherry",
        },
    )
    assert resp.status_code == 200, resp.text
    booking = resp.json()
    assert booking["id"].startswith("DTX-")
    assert booking["distance_km"] == expected_billed
    assert booking["trip_type"] == "round_trip"
    assert booking["days"] == 2

    # Background notify task sets whatsapp_status shortly after creation; poll the admin list for it.
    deadline = time.monotonic() + 10
    status = booking.get("whatsapp_status", "")
    while status != "not_configured" and time.monotonic() < deadline:
        time.sleep(0.5)
        listing = client.get("/bookings", headers={"X-Admin-Key": "droptaxi2026"})
        assert listing.status_code == 200
        match = next((b for b in listing.json() if b["id"] == booking["id"]), None)
        status = match["whatsapp_status"] if match else status
    assert status == "not_configured"
