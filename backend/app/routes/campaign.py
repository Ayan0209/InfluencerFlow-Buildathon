# backend/app/routes/campaign.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.campaign_service import (
    create_campaign,
    get_campaign_by_id,
    list_campaigns,
    update_campaign,
    delete_campaign,
)

router = APIRouter(prefix="/api/campaign", tags=["campaign"])


class ProposedDates(BaseModel):
    start_date: str
    end_date: str


class CampaignPayload(BaseModel):
    business_id: str
    title: str
    description: Optional[str]
    campaign_type: Optional[str]
    categories: Optional[List[str]]
    platform_targets: Optional[List[str]]
    deliverables: Optional[List[str]]
    budget: Optional[float]
    proposed_dates: ProposedDates
    status: Optional[str]
    influencer_ids: Optional[List[str]] = None


@router.get("/")
async def get_all_campaigns():
    """GET /api/campaign/ → return all campaigns"""
    data = list_campaigns()
    return {"campaigns": data}


@router.get("/{id}")
async def get_campaign(id: str):
    """GET /api/campaign/{id} → return a single campaign"""
    data = get_campaign_by_id(id)
    if data is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"campaign": data}


@router.post("/")
async def create_new_campaign(payload: CampaignPayload):
    """
    POST /api/campaign/
    Creates a new campaign row (excluding influencer_ids in the insertion),
    then populates campaign_influencer for any influencer_ids.
    """
    to_insert = {
        "business_id": payload.business_id,
        "title": payload.title,
        "description": payload.description or None,
        "campaign_type": payload.campaign_type or None,
        "categories": payload.categories or None,
        "platform_targets": payload.platform_targets or None,
        "deliverables": payload.deliverables or None,
        "budget": payload.budget or None,
        "proposed_dates": {
            "start_date": payload.proposed_dates.start_date,
            "end_date": payload.proposed_dates.end_date,
        },
        "status": payload.status or None,
    }

    created_campaign = create_campaign(to_insert, payload.influencer_ids)
    if created_campaign is None:
        raise HTTPException(status_code=500, detail="Error creating campaign")

    return {"campaign": created_campaign}


@router.put("/{id}")
async def update_existing_campaign(id: str, payload: CampaignPayload):
    """
    PUT /api/campaign/{id}
    Updates the campaign row (excluding influencer_ids),
    and updates the join table for influencer_ids.
    """
    to_update = {
        "business_id": payload.business_id,
        "title": payload.title,
        "description": payload.description or None,
        "campaign_type": payload.campaign_type or None,
        "categories": payload.categories or None,
        "platform_targets": payload.platform_targets or None,
        "deliverables": payload.deliverables or None,
        "budget": payload.budget or None,
        "proposed_dates": {
            "start_date": payload.proposed_dates.start_date,
            "end_date": payload.proposed_dates.end_date,
        },
        "status": payload.status or None,
    }

    updated_campaign = update_campaign(id, to_update, payload.influencer_ids)
    if updated_campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found or update failed")

    return {"campaign": updated_campaign}


@router.delete("/{id}")
async def delete_existing_campaign(id: str):
    """
    DELETE /api/campaign/{id}
    Deletes the campaign row and its join‐table entries.
    """
    deleted = delete_campaign(id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Campaign not found or delete failed")
    return {"deleted": True}
