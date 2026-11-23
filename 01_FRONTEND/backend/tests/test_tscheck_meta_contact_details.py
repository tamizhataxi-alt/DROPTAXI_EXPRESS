import httpx

BASE_URL = "http://localhost:8001"


def test_meta_contact_details_no_quote_chars():
    """GET /api/meta returns hotline/address/email unquoted, matching backend/.env values."""
    resp = httpx.get(f"{BASE_URL}/api/meta", timeout=10)
    assert resp.status_code == 200
    data = resp.json()

    hotline = data["hotline"]
    address = data["address"]
    email = data["email"]
    whatsapp = data["whatsapp_number"]

    assert hotline == "+91 83009 69007"
    assert address == "Chennai - 600062, Tamil Nadu"
    assert email == "droptaxiexpress.info@gmail.com"
    assert whatsapp == "918300969007"

    # No stray quote characters leaking from env parsing
    for value in (hotline, address, email, whatsapp):
        assert '"' not in value and "'" not in value
