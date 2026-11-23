"""Contact-page enquiries — public create, admin list. All under /api."""

from datetime import datetime, timezone

from fastapi import APIRouter, Header, Request

from lib.db import db
from models.booking import Enquiry, EnquiryCreate
from lib.admin_guard import require_admin

router = APIRouter()


def _to_enquiry(doc: dict) -> Enquiry:
    doc.pop("_id", None)
    created = doc.get("created_at")
    if isinstance(created, datetime) and created.tzinfo is None:
        doc["created_at"] = created.replace(tzinfo=timezone.utc)
    return Enquiry(**doc)


@router.post("/enquiries", response_model=Enquiry)
async def create_enquiry(input: EnquiryCreate):
    enquiry = Enquiry(**input.model_dump())
    await db.enquiries.insert_one(enquiry.model_dump())
    return enquiry


@router.get("/enquiries", response_model=list[Enquiry])
async def list_enquiries(request: Request, x_admin_key: str = Header(default="")):
    require_admin(x_admin_key, request)
    docs = await db.enquiries.find().sort("created_at", -1).to_list(1000)
    return [_to_enquiry(d) for d in docs]
