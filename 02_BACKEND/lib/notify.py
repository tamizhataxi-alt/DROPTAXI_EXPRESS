"""Owner emails (Emergent managed email) + customer WhatsApp receipts (Meta Cloud API or Twilio).

All bodies are fixed server-side templates; the only recipient for email is the configured owner inbox.
Every function here is best-effort: failures are logged, never raised to the customer.
"""

import ipaddress
import logging
import os
import re
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse

import httpx

logger = logging.getLogger(__name__)

EMAIL_BASE_URL = "https://integrations.emergentagent.com"

# ---------------------------------------------------------------- email guardrail gate (from playbook)
_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


async def send_owner_email(subject: str, html: str) -> bool:
    """Send a templated email to the business inbox (OWNER_EMAIL). Never takes a caller-supplied recipient."""
    key = os.environ.get("EMERGENT_EMAIL_KEY", "")
    to = os.environ.get("OWNER_EMAIL", "")
    from_name = os.environ.get("EMAIL_FROM_NAME", "")
    if not (key and to and from_name):
        logger.warning("Email not configured; skipping '%s'", subject)
        return False
    try:
        _assert_safe_email(subject, html)
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": key},
                json={"to": [to], "subject": subject, "html": html, "from_name": from_name},
            )
        if resp.is_error:
            try:
                body = resp.json()
            except ValueError:
                body = {}
            if body.get("code") in ("insufficient_credits", "integration_disabled", "daily_limit_reached"):
                logger.warning("Email paused: %s: %s", body.get("code"), body.get("message", ""))
            else:
                logger.error("Email send failed: %s %s", resp.status_code, resp.text[:300])
            return False
        return True
    except Exception as e:  # noqa: BLE001 — notifications must never break a booking
        logger.error("Email send error: %s", e)
        return False


# ---------------------------------------------------------------- email templates
def _row(label: str, value: str) -> str:
    return (
        f'<tr><td style="padding:6px 12px;color:#5b6070;font-size:13px;width:38%;border-bottom:1px solid #eee">{escape(label)}</td>'
        f'<td style="padding:6px 12px;color:#111;font-size:14px;font-weight:bold;border-bottom:1px solid #eee">{escape(value)}</td></tr>'
    )


def _email_shell(title: str, badge: str, rows: list[tuple[str, str]], phone: str) -> str:
    brand = escape(os.environ.get("EMAIL_FROM_NAME", "Droptaxi Express"))
    body_rows = "".join(_row(k, v) for k, v in rows if v)
    return (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f5ef;padding:24px 0">'
        '<tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" '
        'style="background:#ffffff;border-radius:14px;overflow:hidden;font-family:Arial,sans-serif">'
        f'<tr><td style="background:#FACC15;padding:18px 22px;font-size:20px;font-weight:bold;color:#111">{brand}'
        f'<span style="float:right;background:#111;color:#FACC15;font-size:12px;padding:5px 10px;border-radius:20px">{escape(badge)}</span></td></tr>'
        f'<tr><td style="padding:20px 22px 6px;font-size:18px;font-weight:bold;color:#111">{escape(title)}</td></tr>'
        f'<tr><td style="padding:6px 10px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">{body_rows}</table></td></tr>'
        f'<tr><td style="padding:0 22px 22px"><a href="tel:+91{escape(phone)}" style="display:inline-block;background:#16A34A;color:#fff;'
        f'text-decoration:none;font-weight:bold;padding:10px 18px;border-radius:8px">Call customer +91 {escape(phone)}</a></td></tr>'
        f'<tr><td style="padding:12px 22px;background:#f2f2f2;font-size:11px;color:#777">Automatic notification from the {brand} website booking form.</td></tr>'
        '</table></td></tr></table>'
    )


def _inr(n: int) -> str:
    return f"Rs. {n:,}"


def trip_rows(d: dict) -> list[tuple[str, str]]:
    round_trip = d.get("trip_type") == "round_trip"
    return [
        ("Customer name", d.get("customer_name", "")),
        ("Mobile", f"+91 {d.get('phone', '')}"),
        ("Trip type", "Round trip" if round_trip else "One way drop"),
        ("From", d.get("pickup_city", "")),
        ("Pickup address", d.get("pickup_address", "")),
        ("To", d.get("drop_city", "")),
        ("Drop address", d.get("drop_address", "")),
        ("Pickup date & time", f"{d.get('pickup_date', '')} {d.get('pickup_time', '')}".strip()),
        ("Return date", d.get("return_date", "") if round_trip else ""),
        ("Vehicle", d.get("vehicle_name", "")),
        ("Road distance (one way)", f"{d.get('road_km', '')} km" if d.get("road_km") else ""),
        ("Billed distance", f"{d.get('distance_km', '')} km"),
        ("Approx. travel time", d.get("duration", "")),
        ("Rate", f"{_inr(d.get('rate_per_km', 0))}/km" if d.get("rate_per_km") else ""),
        ("Base fare", _inr(d["base_fare"]) if d.get("base_fare") else ""),
        ("Driver batta", _inr(d["driver_allowance"]) if d.get("driver_allowance") else ""),
        ("Estimated total", _inr(d.get("fare_total", 0))),
        ("Notes", d.get("notes", "")),
        ("Extras", "Tolls, permits & parking at actuals"),
    ]


async def email_enquiry(d: dict) -> bool:
    subject = f"New booking enquiry: {d['pickup_city'][:40]} to {d['drop_city'][:40]} - {d['vehicle_name']}"
    html = _email_shell("New booking enquiry (vehicle selected)", "ENQUIRY", trip_rows(d), d["phone"])
    return await send_owner_email(subject, html)


async def email_confirmation(d: dict) -> bool:
    subject = f"Booking confirmed {d['id']}: {d['pickup_city'][:40]} to {d['drop_city'][:40]}"
    rows = [("Booking ID", d["id"])] + trip_rows(d) + [("Customer WhatsApp receipt", d.get("whatsapp_status", ""))]
    html = _email_shell(f"Trip confirmed by customer - {d['id']}", "CONFIRMED", rows, d["phone"])
    return await send_owner_email(subject, html)


# ---------------------------------------------------------------- WhatsApp receipt
def whatsapp_provider() -> str:
    """'meta', 'twilio' or '' — Meta preferred when both are configured (WHATSAPP_PROVIDER overrides)."""
    meta_ok = all(os.environ.get(k) for k in ("META_WHATSAPP_TOKEN", "META_WHATSAPP_PHONE_NUMBER_ID", "META_WHATSAPP_TEMPLATE"))
    twilio_ok = all(os.environ.get(k) for k in ("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_WHATSAPP_FROM", "TWILIO_CONTENT_SID"))
    preferred = os.environ.get("WHATSAPP_PROVIDER", "").lower()
    if preferred == "twilio" and twilio_ok:
        return "twilio"
    if preferred == "meta" and meta_ok:
        return "meta"
    return "meta" if meta_ok else "twilio" if twilio_ok else ""


def receipt_params(d: dict) -> list[str]:
    """Template variables, in order: {{1}} name, {{2}} booking id, {{3}} from, {{4}} to,
    {{5}} pickup date & time, {{6}} vehicle, {{7}} fare, {{8}} support phone."""
    clip = lambda s: re.sub(r"\s+", " ", str(s)).strip()[:90] or "-"  # noqa: E731 — WhatsApp rejects newlines/tabs in params
    return [
        clip(d["customer_name"]),
        clip(d["id"]),
        clip(d["pickup_city"]),
        clip(d["drop_city"]),
        clip(f"{d['pickup_date']} {d['pickup_time']}"),
        clip(d["vehicle_name"]),
        clip(_inr(d["fare_total"])),
        clip(os.environ.get("HOTLINE", "+91 83009 69007")),
    ]


async def _send_meta(to_digits: str, params: list[str]) -> bool:
    url = (
        f"https://graph.facebook.com/{os.environ.get('META_GRAPH_VERSION', 'v23.0')}/"
        f"{os.environ['META_WHATSAPP_PHONE_NUMBER_ID']}/messages"
    )
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_digits,
        "type": "template",
        "template": {
            "name": os.environ["META_WHATSAPP_TEMPLATE"],
            "language": {"code": os.environ.get("META_WHATSAPP_TEMPLATE_LANG", "en")},
            "components": [{"type": "body", "parameters": [{"type": "text", "text": p} for p in params]}],
        },
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(url, json=payload, headers={"Authorization": f"Bearer {os.environ['META_WHATSAPP_TOKEN']}"})
    if resp.is_error:
        logger.error("Meta WhatsApp send failed: %s %s", resp.status_code, resp.text[:300])
        return False
    return True


async def _send_twilio(to_digits: str, params: list[str]) -> bool:
    import json

    sid = os.environ["TWILIO_ACCOUNT_SID"]
    sender = os.environ["TWILIO_WHATSAPP_FROM"].strip()
    if not sender.startswith("whatsapp:"):
        sender = f"whatsapp:{sender if sender.startswith('+') else '+' + sender}"
    form = {
        "From": sender,
        "To": f"whatsapp:+{to_digits}",
        "ContentSid": os.environ["TWILIO_CONTENT_SID"],
        "ContentVariables": json.dumps({str(i + 1): p for i, p in enumerate(params)}),
    }
    async with httpx.AsyncClient(timeout=15, auth=(sid, os.environ["TWILIO_AUTH_TOKEN"])) as client:
        resp = await client.post(f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json", data=form)
    if resp.is_error:
        logger.error("Twilio WhatsApp send failed: %s %s", resp.status_code, resp.text[:300])
        return False
    return True


async def whatsapp_receipt(d: dict) -> str:
    """Send the confirmation receipt to the customer's WhatsApp. Returns 'sent', 'failed' or 'not_configured'."""
    provider = whatsapp_provider()
    if not provider:
        return "not_configured"
    to_digits = f"91{d['phone']}"
    try:
        ok = await (_send_meta if provider == "meta" else _send_twilio)(to_digits, receipt_params(d))
    except Exception as e:  # noqa: BLE001
        logger.error("WhatsApp send error (%s): %s", provider, e)
        ok = False
    return "sent" if ok else "failed"
