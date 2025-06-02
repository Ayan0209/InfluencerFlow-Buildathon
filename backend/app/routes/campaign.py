# backend/app/routes/campaign.py

from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from app.services.campaign_service import (
    create_campaign,
    get_campaign_by_id,
    list_campaigns,
    update_campaign,
    delete_campaign,
    get_campaigns_for_influencer,
    list_influencers_for_campaign,
    invite_influencer_to_campaign,
    get_join_row,
    get_influencer_performance,
    accept_influencer_invitation,
    reject_influencer_invitation,
    finalize_influencer_terms,
    get_finalized_terms,
    sign_contract_for_influencer,
)
from app.services.negotiation_service import (
    handle_influencer_message_and_counter,
    list_negotiation_messages,
    add_negotiation_message,
)

router = APIRouter(prefix="/api/campaign", tags=["campaign"])


# ----- Pydantic Models -----

class FinalizeTermsPayload(BaseModel):
    agreed_rate_per_post: float
    final_deliverable_details: str

class NegotiationMessagePayload(BaseModel):
    sender_type: str    # e.g. "business" or "influencer"
    message: str


class InvitePayload(BaseModel):
    influencer_id: str


class ProposedDates(BaseModel):
    start_date: str = Field(..., description="YYYY-MM-DD")
    end_date:   str = Field(..., description="YYYY-MM-DD")


class CampaignPayload(BaseModel):
    business_id:      str
    title:            str
    description:      Optional[str] = None
    campaign_type:    Optional[str] = None
    categories:       Optional[List[str]] = None
    platform_targets: Optional[List[str]] = None
    deliverables:     Optional[List[str]] = None
    budget:           Optional[float]     = None
    proposed_dates:   ProposedDates
    status:           Optional[str]       = None
    influencer_ids:   Optional[List[str]] = None


# ----- Campaign CRUD Endpoints -----


@router.get("/", status_code=status.HTTP_200_OK)
async def get_all_campaigns():
    """
    GET /api/campaign/
    Returns a list of all campaigns.
    """
    campaigns = list_campaigns()
    return {"campaigns": campaigns}


@router.get("/{campaign_id}", status_code=status.HTTP_200_OK)
async def get_campaign(campaign_id: str):
    """
    GET /api/campaign/{campaign_id}
    Returns a single campaign by ID.
    """
    campaign = get_campaign_by_id(campaign_id)
    if campaign is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    return {"campaign": campaign}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_new_campaign(payload: CampaignPayload):
    """
    POST /api/campaign/
    Creates a new campaign and optionally invites influencers.
    """
    to_insert = {
        "business_id": payload.business_id,
        "title": payload.title,
        "description": payload.description,
        "campaign_type": payload.campaign_type,
        "categories": payload.categories,
        "platform_targets": payload.platform_targets,
        "deliverables": payload.deliverables,
        "budget": payload.budget,
        "proposed_dates": {
            "start_date": payload.proposed_dates.start_date,
            "end_date": payload.proposed_dates.end_date,
        },
        "status": payload.status,
    }

    created = create_campaign(to_insert, payload.influencer_ids)
    if created is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error creating campaign")
    return {"campaign": created}


@router.put("/{campaign_id}", status_code=status.HTTP_200_OK)
async def update_existing_campaign(campaign_id: str, payload: CampaignPayload):
    """
    PUT /api/campaign/{campaign_id}
    Updates a campaign row and re‐syncs its campaign_influencer invite list.
    """
    to_update = {
        "business_id": payload.business_id,
        "title": payload.title,
        "description": payload.description,
        "campaign_type": payload.campaign_type,
        "categories": payload.categories,
        "platform_targets": payload.platform_targets,
        "deliverables": payload.deliverables,
        "budget": payload.budget,
        "proposed_dates": {
            "start_date": payload.proposed_dates.start_date,
            "end_date": payload.proposed_dates.end_date,
        },
        "status": payload.status,
    }

    updated = update_campaign(campaign_id, to_update, payload.influencer_ids)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found or update failed")
    return {"campaign": updated}


@router.delete("/{campaign_id}", status_code=status.HTTP_200_OK)
async def delete_existing_campaign(campaign_id: str):
    """
    DELETE /api/campaign/{campaign_id}
    Deletes the campaign and any campaign_influencer rows.
    """
    deleted = delete_campaign(campaign_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found or delete failed")
    return {"deleted": True}


# ----- Campaign‐Influencer (Join Table) Endpoints -----


@router.get("/influencer/{influencer_id}", status_code=status.HTTP_200_OK)
async def get_campaigns_for_one_influencer(influencer_id: str):
    """
    GET /api/campaign/influencer/{influencer_id}
    Returns all campaigns (with invite_status) to which this influencer belongs.
    """
    campaigns = get_campaigns_for_influencer(influencer_id)
    return {"campaigns": campaigns}


@router.get("/{campaign_id}/influencers", status_code=status.HTTP_200_OK)
async def get_campaign_influencers(campaign_id: str):
    """
    GET /api/campaign/{campaign_id}/influencers
    Returns a list of invited influencers for this campaign.
    """
    influencers = list_influencers_for_campaign(campaign_id)
    return {"influencers": influencers}


@router.post("/{campaign_id}/invite", status_code=status.HTTP_200_OK)
async def invite_influencer(campaign_id: str, payload: InvitePayload):
    """
    POST /api/campaign/{campaign_id}/invite
    Invite a new influencer (status = 'Pending').
    """
    success = invite_influencer_to_campaign(campaign_id, payload.influencer_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to send invite")
    return {"success": True}


@router.post("/{campaign_id}/influencers/{influencer_id}/accept", status_code=status.HTTP_200_OK)
async def accept_invitation(campaign_id: str, influencer_id: str):
    """
    POST /api/campaign/{campaign_id}/influencers/{influencer_id}/accept
    Change status='Pending' → 'Accepted'.
    """
    success = accept_influencer_invitation(campaign_id, influencer_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot accept invitation (maybe none pending or already accepted).",
        )
    return {"message": "Invitation accepted."}


@router.post("/{campaign_id}/influencers/{influencer_id}/reject", status_code=status.HTTP_200_OK)
async def reject_invitation(campaign_id: str, influencer_id: str):
    """
    POST /api/campaign/{campaign_id}/influencers/{influencer_id}/reject
    Change status='Pending' → 'Rejected'.
    """
    success = reject_influencer_invitation(campaign_id, influencer_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reject invitation (maybe none pending or already rejected).",
        )
    return {"message": "Invitation rejected."}


@router.get("/{campaign_id}/influencers/{influencer_id}", status_code=status.HTTP_200_OK)
async def get_join_for_influencer(campaign_id: str, influencer_id: str):
    """
    GET /api/campaign/{campaign_id}/influencers/{influencer_id}
    Returns the join‐table row:
      { status, deliverables_submitted, payment_status, performance }
    """
    join_row = get_join_row(campaign_id, influencer_id)
    if join_row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Join row not found")
    return {"join": join_row}


@router.get("/{campaign_id}/influencers/{influencer_id}/performance", status_code=status.HTTP_200_OK)
async def get_performance(campaign_id: str, influencer_id: str):
    """
    GET /api/campaign/{campaign_id}/influencers/{influencer_id}/performance
    Returns the JSON stored in `performance` (e.g. { "views": 123, "likes": 45 }).
    """
    perf = get_influencer_performance(campaign_id, influencer_id)
    if perf is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Performance data not found")
    return {"performance": perf}


@router.get(
    "/{campaign_id}/negotiation/{influencer_id}",
    response_model=List[Dict],  # each dict has id, campaign_id, influencer_id, sender_type, message, created_at
    status_code=status.HTTP_200_OK,
)
async def get_negotiations(campaign_id: str, influencer_id: str):
    """
    GET /api/campaign/{campaign_id}/negotiation/{influencer_id}
    Returns a list of negotiation messages in chronological order.
    """
    rows = list_negotiation_messages(campaign_id, influencer_id)
    return rows


@router.post(
    "/{campaign_id}/negotiation/{influencer_id}",
    status_code=status.HTTP_201_CREATED,
)
async def post_negotiation_message(
    campaign_id: str,
    influencer_id: str,
    payload: NegotiationMessagePayload,
):
    """
    POST /api/campaign/{campaign_id}/negotiation/{influencer_id}
    Body:
    {
      "sender_type": "influencer",
      "message": "I can do ₹5000 per post."
    }
    Inserts the influencer’s message and then auto‑generates a business AI reply.
    Returns { "ai_response": "<text>" }.
    """
    # Only allow an influencer to trigger the AI counter‑offer
    if payload.sender_type != "influencer":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payload sender_type must be 'influencer'.",
        )

    ai_response = handle_influencer_message_and_counter(
        campaign_id=campaign_id,
        influencer_id=influencer_id,
        influencer_message=payload.message,
    )

    if ai_response is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process negotiation.",
        )

    return {"ai_response": ai_response}

@router.post(
    "/{campaign_id}/influencers/{influencer_id}/finalize",
    status_code=status.HTTP_200_OK,
)
async def finalize_terms(
    campaign_id: str,
    influencer_id: str,
    payload: FinalizeTermsPayload,
):
    """
    POST /api/campaign/{campaign_id}/influencers/{influencer_id}/finalize
    Body:
      { "agreed_rate_per_post": 4500, "final_deliverable_details": "Instagram Reel + 3 Stories" }
    Updates campaign_influencer:
      - status = "Ready to Sign Contract"
      - rate_per_post = payload.agreed_rate_per_post
      - final_deliverables = payload.final_deliverable_details (could be stored in JSONB or a text column)
    """
    try:
        success = finalize_influencer_terms(
            campaign_id=campaign_id,
            influencer_id=influencer_id,
            agreed_rate=payload.agreed_rate_per_post,
            deliverable_details=payload.final_deliverable_details,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not success:
        raise HTTPException(
            status_code=400,
            detail="Unable to finalize terms (possibly no existing link).",
        )

    return {"message": "Terms finalized; ready to sign contract."}

@router.get(
    "/{campaign_id}/influencers/{influencer_id}/terms",
    status_code=status.HTTP_200_OK
)
async def get_terms(campaign_id: str, influencer_id: str):
    """
    GET /api/campaign/{campaign_id}/influencers/{influencer_id}/terms
    Returns { agreed_rate_per_post, final_deliverable_details } from campaign_influencer.
    """
    terms = get_finalized_terms(campaign_id, influencer_id)
    if terms is None:
        raise HTTPException(status_code=404, detail="Finalized terms not found")
    return terms

@router.post(
    "/{campaign_id}/influencers/{influencer_id}/sign",
    status_code=status.HTTP_200_OK
)
async def post_sign_contract(campaign_id: str, influencer_id: str):
    """
    POST /api/campaign/{campaign_id}/influencers/{influencer_id}/sign
    Sets campaign_influencer.status = "Signed"
    """
    try:
        success = sign_contract_for_influencer(campaign_id, influencer_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not success:
        raise HTTPException(
            status_code=400,
            detail="Unable to sign contract (maybe no join row)."
        )
    return {"message": "Contract signed successfully."}