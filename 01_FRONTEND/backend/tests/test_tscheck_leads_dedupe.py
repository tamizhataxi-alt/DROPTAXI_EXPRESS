"""Enquiry email on vehicle selection: POST /api/leads emails once, then dedupes within 30 min
for the same phone + trip + vehicle + date.
"""

PHONE = "9811122200"  # tscheck fixture phone, shared with the lead-email browser check (intentional dedupe)


def _payload():
    return {
        "customer_name": "TEST_tscheck_lead",
        "phone": PHONE,
        "pickup_city": "Chennai",
        "drop_city": "Pondicherry (Puducherry)",
        "pickup_place_id": "city:Chennai",
        "drop_place_id": "city:Pondicherry (Puducherry)",
        "pickup_date": "2027-01-15",
        "pickup_time": "09:00",
        "vehicle_id": "sedan",
        "trip_type": "one_way",
    }


def test_lead_creates_and_dedupes(client):
    first = client.post("/leads", json=_payload())
    assert first.status_code == 200, first.text
    body = first.json()
    assert body["ok"] is True
    # emailed is True the first time unless email isn't configured server-side (still ok:true either way,
    # the dedupe behaviour on the 2nd call is the part this test asserts).
    first_emailed = body["emailed"]

    second = client.post("/leads", json=_payload())
    assert second.status_code == 200, second.text
    second_body = second.json()
    assert second_body["ok"] is True
    if first_emailed:
        assert second_body["emailed"] is False
