# backend/app/routes/business.py
from fastapi import APIRouter, HTTPException
from app.services.business_service import (
    get_business_by_id,
    list_businesses,
    create_business,
    update_business,
    delete_business,
)
from app.services.campaign_service import list_campaigns

router = APIRouter(prefix="/api/business", tags=["business"])


@router.get("/")
async def get_all_businesses():
    """
    GET /api/business/
    Returns a list of all businesses.
    """
    data = list_businesses()
    return {"businesses": data}


@router.get("/{id}")
async def get_business(id: str):
    """
    GET /api/business/{id}
    Returns the business row with the given UUID.
    """
    data = get_business_by_id(id)
    if data is None:
        raise HTTPException(status_code=404, detail="Business not found")
    return {"business": data}


@router.post("/")
async def create_new_business(payload: dict):
    """
    POST /api/business/
    Creates a new business row. 
    Expects the full dictionary of business fields in the request body.
    """
    created = create_business(payload)
    if created is None:
        raise HTTPException(status_code=500, detail="Error creating business")
    return {"business": created}


@router.put("/{id}")
async def update_existing_business(id: str, payload: dict):
    """
    PUT /api/business/{id}
    Updates the business with the given UUID.
    """
    updated = update_business(id, payload)
    if updated is None:
        raise HTTPException(status_code=404, detail="Business not found or update failed")
    return {"business": updated}


@router.delete("/{id}")
async def delete_existing_business(id: str):
    """
    DELETE /api/business/{id}
    Deletes the business with the given UUID.
    """
    deleted = delete_business(id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Business not found or delete failed")
    return {"deleted": True}

@router.get("/{id}/campaigns")
async def get_business_campaigns(id: str):
    """
    GET /api/business/{id}/campaigns
    Returns all campaigns whose `business_id` matches this id.
    """
    all_campaigns = list_campaigns() or []
    # Filter in‐memory (or you can write a service that does a WHERE clause)
    campaigns_for_business = [
        c for c in all_campaigns if c.get("business_id") == id
    ]
    return {"campaigns": campaigns_for_business}
