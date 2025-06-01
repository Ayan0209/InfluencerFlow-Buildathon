# backend/app/routes/influencer.py
from fastapi import APIRouter, HTTPException
from app.services.influencer_service import (
    get_influencer_by_id,
    list_influencers,
)
from app.services.campaign_service import list_campaigns, get_campaigns_for_influencer

router = APIRouter(prefix="/api/influencer", tags=["influencer"])

@router.get("/")
async def get_all_influencers():
    """
    GET /api/influencer/
    Returns a list of all influencers.
    """
    data = list_influencers()
    return {"influencers": data}


@router.get("/{id}")
async def get_influencer(id: str):
    """
    GET /api/influencer/{id}
    Returns the influencer row with the given UUID.
    """
    data = get_influencer_by_id(id)
    if data is None:
        raise HTTPException(status_code=404, detail="Influencer not found")
    return {"influencer": data}


@router.get("/{id}/campaigns")
async def get_influencer_campaigns(id: str):
    """
    GET /api/influencer/{id}/campaigns
    Returns all campaigns that this influencer has been invited to,
    by querying the campaign_influencer join table.
    """
    # (Optional) first verify that influencer actually exists
    if get_influencer_by_id(id) is None:
        raise HTTPException(status_code=404, detail="Influencer not found")

    campaigns = get_campaigns_for_influencer(id)
    return {"campaigns": campaigns}
