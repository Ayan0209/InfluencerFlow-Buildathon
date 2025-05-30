from fastapi import APIRouter
from pydantic import BaseModel
from app.services.outreach_service import send_outreach_email

router = APIRouter()

class OutreachSendRequest(BaseModel):
    campaign_id: int
    creator_id: int
    brief: str

class OutreachSendResponse(BaseModel):
    success: bool
    subject: str
    body: str

@router.post("/outreach/send", response_model=OutreachSendResponse)
def send_outreach(req: OutreachSendRequest):
    result = send_outreach_email(req.campaign_id, req.creator_id, req.brief)
    return OutreachSendResponse(**result) 