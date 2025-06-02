# backend/app/routes/business.py

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from app.services.business_service import (
    get_business_by_id,
    list_businesses,
    create_business,
    update_business,
    delete_business,
    list_campaigns_for_business,
)

router = APIRouter(prefix="/api/business", tags=["business"])


class BusinessPayload(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    password_hash: str
    description: Optional[str] = None
    website_url: Optional[HttpUrl] = None
    industry: Optional[str] = None
    social_links: Optional[dict] = None   # e.g. {"facebook": "url", "twitter": "url"}
    location: Optional[dict] = None       # e.g. {"city": "...", "country": "..."}


@router.get("/", status_code=status.HTTP_200_OK)
async def get_all_businesses():
    """
    GET /api/business/
    Returns a list of all businesses.
    """
    businesses = list_businesses()
    return {"businesses": businesses}


@router.get("/{business_id}", status_code=status.HTTP_200_OK)
async def get_business(business_id: str):
    """
    GET /api/business/{business_id}
    Returns the business row with the given UUID.
    """
    business = get_business_by_id(business_id)
    if business is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")
    return {"business": business}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_new_business(payload: BusinessPayload):
    """
    POST /api/business/
    Creates a new business row.
    """
    created = create_business(payload.dict())
    if created is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error creating business")
    return {"business": created}


@router.put("/{business_id}", status_code=status.HTTP_200_OK)
async def update_existing_business(business_id: str, payload: BusinessPayload):
    """
    PUT /api/business/{business_id}
    Updates the business with the given UUID.
    """
    updated = update_business(business_id, payload.dict())
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found or update failed")
    return {"business": updated}


@router.delete("/{business_id}", status_code=status.HTTP_200_OK)
async def delete_existing_business(business_id: str):
    """
    DELETE /api/business/{business_id}
    Deletes the business with the given UUID.
    """
    deleted = delete_business(business_id)
    if deleted is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found or delete failed")
    return {"deleted": True}


@router.get("/{business_id}/campaigns", status_code=status.HTTP_200_OK)
async def get_business_campaigns(business_id: str):
    """
    GET /api/business/{business_id}/campaigns
    Returns all campaigns whose `business_id` matches this id.
    """
    # Verify business exists
    if get_business_by_id(business_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")

    campaigns = list_campaigns_for_business(business_id)
    return {"campaigns": campaigns}
