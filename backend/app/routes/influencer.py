# backend/app/routes/influencer.py

from fastapi import APIRouter, HTTPException, status
from app.services.influencer_service import (
    get_influencer_by_id,
    list_influencers,
    get_payment_status,
    mark_campaign_complete,
)
from app.services.campaign_service import (
    get_campaigns_for_influencer,
    accept_influencer_invitation,
    reject_influencer_invitation,
)

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
    influencer = get_influencer_by_id(id)
    if influencer is None:
        raise HTTPException(status_code=404, detail="Influencer not found")
    return {"influencer": influencer}


@router.get("/{id}/campaigns")
async def get_influencer_campaigns(id: str):
    """
    GET /api/influencer/{id}/campaigns
    Returns all campaigns that this influencer has been invited to,
    including invite_status.
    """
    if get_influencer_by_id(id) is None:
        raise HTTPException(status_code=404, detail="Influencer not found")

    campaigns = get_campaigns_for_influencer(id)
    return {"campaigns": campaigns}


@router.post("/{id}/campaigns/{campaign_id}/accept", status_code=status.HTTP_200_OK)
async def accept_campaign_invitation(id: str, campaign_id: str):
    """
    POST /api/influencer/{id}/campaigns/{campaign_id}/accept
    Marks this influencer's invitation to the campaign as "Accepted".
    """
    if get_influencer_by_id(id) is None:
        raise HTTPException(status_code=404, detail="Influencer not found")

    try:
        success = accept_influencer_invitation(campaign_id, id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not success:
        raise HTTPException(
            status_code=400,
            detail="Unable to accept invitation (maybe none exists or already accepted).",
        )

    return {"message": "Invitation accepted successfully."}


@router.post("/{id}/campaigns/{campaign_id}/reject", status_code=status.HTTP_200_OK)
async def reject_campaign_invitation(id: str, campaign_id: str):
    """
    POST /api/influencer/{id}/campaigns/{campaign_id}/reject
    Marks this influencer's invitation to the campaign as "Rejected".
    """
    if get_influencer_by_id(id) is None:
        raise HTTPException(status_code=404, detail="Influencer not found")

    try:
        success = reject_influencer_invitation(campaign_id, id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not success:
        raise HTTPException(
            status_code=400,
            detail="Unable to reject invitation (maybe none exists or already rejected).",
        )

    return {"message": "Invitation rejected successfully."}


@router.get("/{influencer_id}/campaign/{campaign_id}/payment-status")
async def payment_status(influencer_id: str, campaign_id: str):
    """
    GET /api/influencer/{influencer_id}/campaign/{campaign_id}/payment-status
    Returns { paid: boolean } for this influencer+campaign.
    """
    if get_influencer_by_id(influencer_id) is None:
        raise HTTPException(status_code=404, detail="Influencer not found")

    try:
        paid = get_payment_status(influencer_id, campaign_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"paid": paid}


@router.post("/{influencer_id}/campaign/{campaign_id}/complete", status_code=status.HTTP_200_OK)
async def complete_campaign(influencer_id: str, campaign_id: str):
    """
    POST /api/influencer/{influencer_id}/campaign/{campaign_id}/complete
    Marks the join‐table row status="Completed" for this influencer+campaign.
    """
    if get_influencer_by_id(influencer_id) is None:
        raise HTTPException(status_code=404, detail="Influencer not found")

    try:
        success = mark_campaign_complete(campaign_id, influencer_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not success:
        raise HTTPException(
            status_code=400,
            detail="Unable to mark complete (maybe no join record or not eligible).",
        )

    return {"message": "Campaign marked as complete."}
