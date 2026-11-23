"""Admin passcode check: constant-time compare, no in-code default, per-IP lockout on repeated failures."""

import hmac
import os
import time

from fastapi import HTTPException, Request

MAX_FAILURES = 8
WINDOW_SECONDS = 15 * 60

_failures: dict[str, list[float]] = {}


def client_ip(request: Request | None) -> str:
    if request is None:
        return "unknown"
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _recent(ip: str) -> list[float]:
    now = time.monotonic()
    hits = [t for t in _failures.get(ip, []) if now - t < WINDOW_SECONDS]
    _failures[ip] = hits
    return hits


def check_passcode(candidate: str, request: Request | None) -> bool:
    """True when the passcode matches. Raises 429 while the caller's IP is locked out."""
    ip = client_ip(request)
    if len(_recent(ip)) >= MAX_FAILURES:
        raise HTTPException(status_code=429, detail="Too many wrong attempts. Try again in 15 minutes.")
    expected = os.environ.get("ADMIN_PASSCODE", "")
    ok = bool(expected) and bool(candidate) and hmac.compare_digest(candidate.encode(), expected.encode())
    if ok:
        _failures.pop(ip, None)
    else:
        _failures.setdefault(ip, []).append(time.monotonic())
    return ok


def require_admin(x_admin_key: str, request: Request | None = None) -> None:
    if not check_passcode(x_admin_key, request):
        raise HTTPException(status_code=401, detail="Invalid admin passcode")
