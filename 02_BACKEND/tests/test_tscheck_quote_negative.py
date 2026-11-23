"""Negative validation: POST /api/quote/options rejects invalid place ids and past pickup dates."""


def test_quote_options_invalid_place_id_422(client):
    resp = client.post(
        "/quote/options",
        json={
            "from_city": "Chennai",
            "to_city": "Bangalore",
            "from_place_id": "not-a-valid-id!!",  # fails GOOGLE_ID_RE and isn't a city: id
            "to_place_id": "city:Bangalore",
            "trip_type": "one_way",
            "days": 1,
        },
    )
    assert resp.status_code == 422, resp.text


def test_booking_pickup_date_in_past_422(client):
    resp = client.post(
        "/bookings",
        json={
            "customer_name": "TEST_tscheck_negative",
            "phone": "9800000011",
            "pickup_city": "Chennai",
            "drop_city": "Bangalore",
            "pickup_place_id": "city:Chennai",
            "drop_place_id": "city:Bangalore",
            "pickup_date": "2020-01-01",
            "pickup_time": "09:00",
            "vehicle_id": "sedan",
            "trip_type": "one_way",
            "pickup_address": "tscheck test address 1",
            "drop_address": "tscheck test address 2",
        },
    )
    assert resp.status_code == 422, resp.text
    assert "past" in resp.json()["detail"].lower()
