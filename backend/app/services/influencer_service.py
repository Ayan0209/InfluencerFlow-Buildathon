# backend/app/services/influencer_service.py

from app.services.supabase_client import supabase


def get_influencer_by_id(influencer_id: str):
    resp = supabase.table("influencer").select("*").eq("id", influencer_id).single().execute()
    return resp.data if resp and not getattr(resp, "error", None) else None


def list_influencers():
    resp = supabase.table("influencer").select("*").execute()
    return resp.data or []


def create_influencer(data: dict):
    resp = supabase.table("influencer").insert(data).single().execute()
    return resp.data if resp and not getattr(resp, "error", None) else None


def update_influencer(influencer_id: str, data: dict):
    resp = supabase.table("influencer").update(data).eq("id", influencer_id).single().execute()
    return resp.data if resp and not getattr(resp, "error", None) else None


def delete_influencer(influencer_id: str):
    resp = supabase.table("influencer").delete().eq("id", influencer_id).execute()
    return resp.data or []


def search_influencers(query: str) -> list[dict]:
    resp = (
        supabase
        .table("influencer")
        .select("*")
        .ilike("name", f"%{query}%")
        .execute()
    )
    return resp.data or []


def get_payment_status(influencer_id: str, campaign_id: str) -> bool:
    """
    Return True if the influencer has been paid for this campaign.
    We assume `payment_status` is a column in campaign_influencer or
    you have a separate payments table. Here we read from campaign_influencer.
    """
    resp = (
        supabase.table("campaign_influencer")
        .select("payment_status")
        .eq("influencer_id", influencer_id)
        .eq("campaign_id", campaign_id)
        .single()
        .execute()
    )
    if resp is None or getattr(resp, "error", None):
        raise RuntimeError(f"DB error when fetching payment status: {resp.error.message if resp and hasattr(resp,'error') else 'None returned'}")

    row = resp.data or {}
    # Assuming `payment_status` column is boolean or "Paid"/"Pending"
    return bool(row.get("payment_status"))


def mark_campaign_complete(campaign_id: str, influencer_id: str) -> bool:
    """
    Updates campaign_influencer.status = 'Completed' for this influencer+campaign.
    Returns True if exactly one row was updated.
    """
    # 1) Fetch existing join row
    check = (
        supabase.table("campaign_influencer")
        .select("status")
        .eq("campaign_id", campaign_id)
        .eq("influencer_id", influencer_id)
        .single()
        .execute()
    )
    if check is None or getattr(check, "error", None):
        raise RuntimeError(f"DB error when looking up join row: {check.error.message if check and hasattr(check,'error') else 'None returned'}")

    if not check.data or check.data.get("status") != "Accepted":
        # Only an Accepted invitation can be marked Completed
        return False

    # 2) Update to Completed
    update = (
        supabase.table("campaign_influencer")
        .update({"status": "Completed"})
        .eq("campaign_id", campaign_id)
        .eq("influencer_id", influencer_id)
        .execute()
    )
    if update is None or getattr(update, "error", None):
        raise RuntimeError(f"DB error when marking complete: {update.error.message if update and hasattr(update,'error') else 'None returned'}")

    return bool(update.data)
