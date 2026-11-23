"""SEC-001: admin passcode hardening.

- POST /api/admin/verify: wrong passcode -> ok:false, correct -> ok:true
- GET /api/bookings without / with wrong X-Admin-Key -> 401
- 8 wrong attempts from the same IP within the lockout window -> 429 on the 9th attempt
  (run last, using a dedicated X-Forwarded-For so it never collides with other tests' IP bucket)
"""

import os

import pytest

ADMIN_PASSCODE = os.environ.get("ADMIN_PASSCODE", "droptaxi2026")


def test_admin_verify_wrong_passcode_rejected(client):
    resp = client.post("/admin/verify", json={"passcode": "not-the-real-passcode"})
    assert resp.status_code == 200, resp.text
    assert resp.json()["ok"] is False


def test_admin_verify_correct_passcode_accepted(client):
    resp = client.post(
        "/admin/verify",
        json={"passcode": ADMIN_PASSCODE},
        headers={"X-Forwarded-For": "10.10.10.21"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["ok"] is True


def test_bookings_requires_admin_key(client):
    no_key = client.get("/bookings")
    assert no_key.status_code == 401, no_key.text

    wrong_key = client.get("/bookings", headers={"X-Admin-Key": "wrong-key"})
    assert wrong_key.status_code == 401, wrong_key.text

    ok = client.get("/bookings", headers={"X-Admin-Key": ADMIN_PASSCODE})
    assert ok.status_code == 200, ok.text
    assert isinstance(ok.json(), list)


def test_admin_lockout_after_8_wrong_attempts(client):
    """Distinct XFF so this test's lockout never blocks the other tests in this file/session."""
    xff = {"X-Forwarded-For": "203.0.113.77"}
    for i in range(8):
        resp = client.post("/admin/verify", json={"passcode": f"wrong-{i}"}, headers=xff)
        assert resp.status_code == 200, resp.text
        assert resp.json()["ok"] is False

    locked = client.post("/admin/verify", json={"passcode": "wrong-again"}, headers=xff)
    assert locked.status_code == 429, locked.text

    # Even the correct passcode is rejected with 429 while locked out.
    locked_correct = client.post("/admin/verify", json={"passcode": ADMIN_PASSCODE}, headers=xff)
    assert locked_correct.status_code == 429, locked_correct.text

    # Lockout also applies to the bookings admin endpoint for the same IP.
    locked_bookings = client.get("/bookings", headers={**xff, "X-Admin-Key": ADMIN_PASSCODE})
    assert locked_bookings.status_code == 429, locked_bookings.text
