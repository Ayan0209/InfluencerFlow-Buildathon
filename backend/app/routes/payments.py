# backend/app/routes/payments.py

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict

from app.services.payment_service import (
    create_mock_order,
    mark_payment_success,
    get_payment_history,
)

router = APIRouter(prefix="/api/payment", tags=["payment"])


class CreateOrderPayload(BaseModel):
    campaign_id: str
    influencer_id: str
    payment_amount: float   # amount in rupees


@router.post("/create_order", status_code=200)
async def create_order(payload: CreateOrderPayload):
    """
    POST /api/payment/create_order
    Body: { campaign_id, influencer_id, payment_amount }
    """
    try:
        data = create_mock_order(
            payload.campaign_id,
            payload.influencer_id,
            payload.payment_amount,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return data


class VerifyPayload(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/verify", status_code=200)
async def verify_payment(payload: VerifyPayload):
    """
    POST /api/payment/verify
    Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
    """
    success = mark_payment_success(
        payload.razorpay_order_id,
        payload.razorpay_payment_id,
        payload.razorpay_signature,
    )
    if not success:
        raise HTTPException(status_code=400, detail="Payment verification failed")
    return {"success": True}


@router.get("/history", status_code=200)
async def payment_history(
    campaign_id: str = Query(...),
    influencer_id: str = Query(...),
):
    """
    GET /api/payment/history?campaign_id=...&influencer_id=...
    Returns: [ { id, amount, status, razorpay_order_id, razorpay_payment_id, created_at }, … ]
    """
    rows = get_payment_history(campaign_id, influencer_id)
    return {"payments": rows}
