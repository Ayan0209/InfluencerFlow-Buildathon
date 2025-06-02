# backend/app/services/payment_service.py

import uuid
from datetime import datetime
from typing import Dict, List, Optional

from app.services.supabase_client import supabase


def get_payment_history(campaign_id: str, influencer_id: str) -> List[Dict]:
    """
    Returns a list of all payments (rows) for this campaign+influencer.
    Each row: { id, amount, status, razorpay_order_id, razorpay_payment_id, razorpay_signature, created_at }
    """
    resp = (
        supabase.table("payments")
        .select("id, amount, status, razorpay_order_id, razorpay_payment_id, razorpay_signature, created_at")
        .eq("campaign_id", campaign_id)
        .eq("influencer_id", influencer_id)
        .order("created_at", desc=False)
        .execute()
    )
    if resp is None or getattr(resp, "error", None):
        return []
    return resp.data or []


def create_mock_order(
    campaign_id: str,
    influencer_id: str,
    payment_amount: float
) -> Dict:
    """
    1) Verify that campaign_influencer exists and retrieve the agreed total rate_per_post (or total)
    2) Ensure payment_amount <= remaining balance
    3) Generate a mock order_id
    4) Insert new row in 'payments' with status='Pending', amount=payment_amount
    5) Return { order_id, amount (paise), currency, key_id }
    """

    # 1) Fetch the agreed total from campaign_influencer
    ji_resp = (
        supabase.table("campaign_influencer")
        .select("rate_per_post")
        .eq("campaign_id", campaign_id)
        .eq("influencer_id", influencer_id)
        .execute()
    )
    if ji_resp is None or getattr(ji_resp, "error", None) or not ji_resp.data:
        raise RuntimeError("campaign_influencer link not found")

    row_data = ji_resp.data
    if isinstance(row_data, list) and len(row_data) > 0:
        agreed_total = row_data[0].get("rate_per_post")
    else:
        agreed_total = row_data.get("rate_per_post")

    if agreed_total is None or agreed_total <= 0:
        raise RuntimeError("Invalid agreed total for payment")

    # 2) Compute already paid
    hist = get_payment_history(campaign_id, influencer_id)
    already_paid = sum(r.get("amount", 0) for r in hist if r.get("status") == "Paid")

    remaining = agreed_total - already_paid
    if payment_amount <= 0 or payment_amount > remaining:
        raise RuntimeError(f"Invalid payment amount. Remaining: {remaining}")

    # 3) Generate mock order ID
    mock_order_id = f"order_mock_{uuid.uuid4().hex}"

    # 4) Insert new payment row with status='Pending'
    insert_data = {
        "campaign_id": campaign_id,
        "influencer_id": influencer_id,
        "amount": payment_amount,
        "status": "Pending",
        "razorpay_order_id": mock_order_id,
    }
    p_resp = supabase.table("payments").insert(insert_data).execute()
    if p_resp is None or getattr(p_resp, "error", None) or not p_resp.data:
        raise RuntimeError("Failed to create payment record")

    # 5) Return info for frontend
    amount_paise = int(payment_amount * 100)
    return {
        "order_id": mock_order_id,
        "amount": amount_paise,
        "currency": "INR",
        "key_id": "rzp_test_MOCKKEY123",
    }


def mark_payment_success(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str
) -> bool:
    """
    1) Look up the payments row by razorpay_order_id
    2) Update status = 'Paid', store payment_id & signature, updated_at
    3) Return True if successful
    """
    resp = (
        supabase.table("payments")
        .select("id, status")
        .eq("razorpay_order_id", razorpay_order_id)
        .execute()
    )
    if resp is None or getattr(resp, "error", None) or not resp.data:
        return False

    payment_rows = resp.data
    payment_row = payment_rows[0] if isinstance(payment_rows, list) else payment_rows

    if payment_row.get("status") != "Pending":
        return False

    payment_id = payment_row.get("id")
    update_data = {
        "status": "Paid",
        "razorpay_payment_id": razorpay_payment_id,
        "razorpay_signature": razorpay_signature,
        "updated_at": datetime.utcnow().isoformat(),
    }
    upd_resp = (
        supabase.table("payments")
        .update(update_data)
        .eq("id", payment_id)
        .execute()
    )
    if upd_resp is None or getattr(upd_resp, "error", None):
        return False

    return True
