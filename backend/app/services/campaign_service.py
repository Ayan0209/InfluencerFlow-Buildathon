# backend/app/services/campaign_service.py
from app.services.supabase_client import supabase

def get_campaign_by_id(campaign_id: str):
    resp = supabase.table("campaign").select("*").eq("id", campaign_id).execute()
    return resp.data[0] if isinstance(resp.data, list) and resp.data else None

def list_campaigns():
    resp = supabase.table("campaign").select("*").execute()
    return resp.data or []

def create_campaign(data: dict, influencer_ids: list[str] = None):
    """
    Inserts a new campaign row, converting 'proposed_dates' to a daterange string if needed,
    then (if influencer_ids provided) inserts into the campaign_influencer join table.
    Returns the newly created campaign row, or None on failure.
    """
    insert_data = data.copy()

    # Convert proposed_dates dict to Postgres daterange string "[start,end]"
    pd = insert_data.pop("proposed_dates", None)
    if isinstance(pd, dict):
        start = pd.get("start_date")
        end = pd.get("end_date")
        insert_data["proposed_dates"] = f"[{start},{end}]"

    resp = supabase.table("campaign").insert(insert_data).execute()

    # If resp.data is None or empty, treat as failure
    if not resp.data:
        # Optionally log resp.error_message
        return None

    created_campaign = resp.data[0]
    campaign_id = created_campaign.get("id")

    if influencer_ids:
        rows = [
            {"campaign_id": campaign_id, "influencer_id": inf_id}
            for inf_id in influencer_ids
        ]
        link_resp = supabase.table("campaign_influencer").insert(rows).execute()
        # We ignore link_resp.error here for MVP

    return created_campaign

def update_campaign(campaign_id: str, data: dict, influencer_ids: list[str] = None):
    """
    Updates the campaign row (excluding influencer_ids), then updates the join table:
    - Deletes existing campaign_influencer rows for this campaign
    - Re-inserts the new influencer_ids
    Returns the updated campaign row, or None on failure.
    """
    update_data = data.copy()
    update_data.pop("influencer_ids", None)

    resp = supabase.table("campaign").update(update_data).eq("id", campaign_id).execute()
    if not resp.data:
        return None

    updated_campaign = resp.data[0]

    if influencer_ids is not None:
        # Delete existing links
        supabase.table("campaign_influencer").delete().eq("campaign_id", campaign_id).execute()

        # Insert new links
        rows = [
            {"campaign_id": campaign_id, "influencer_id": inf_id}
            for inf_id in influencer_ids
        ]
        supabase.table("campaign_influencer").insert(rows).execute()

    return updated_campaign

def delete_campaign(campaign_id: str):
    """
    Deletes both the campaign row and its join‐table entries.
    Returns the deleted campaign row(s) list, or an empty list on failure.
    """
    # 1) Delete join rows
    supabase.table("campaign_influencer").delete().eq("campaign_id", campaign_id).execute()

    # 2) Delete campaign row
    resp = supabase.table("campaign").delete().eq("id", campaign_id).execute()
    return resp.data or []


def get_campaigns_for_influencer(influencer_id: str):
    """
    1) Fetch all campaign_influencer rows matching influencer_id
    2) Extract campaign_id list
    3) Fetch campaign rows whose id is in that list
    """
    # 1) Query the join table
    ji_resp = supabase.table("campaign_influencer") \
        .select("campaign_id") \
        .eq("influencer_id", influencer_id) \
        .execute()

    if not ji_resp.data:
        return []  # No matches or error

    campaign_ids = [row["campaign_id"] for row in ji_resp.data]

    # 2) Now fetch those campaigns
    c_resp = supabase.table("campaign") \
        .select("*") \
        .in_("id", campaign_ids) \
        .execute()

    return c_resp.data or []
