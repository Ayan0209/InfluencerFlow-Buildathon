# backend/app/services/campaign_services.py

from typing import Optional, List, Dict, Any
from app.services.supabase_client import supabase


# ----- Campaign CRUD Operations -----


def get_campaign_by_id(campaign_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch a single campaign by its primary key.
    """
    resp = (
        supabase
        .table("campaign")
        .select("*")
        .eq("id", campaign_id)
        .single()
        .execute()
    )
    return resp.data if resp and not getattr(resp, "error", None) else None


def list_campaigns() -> List[Dict[str, Any]]:
    """
    Return all campaigns (no filtering).
    """
    resp = supabase.table("campaign").select("*").execute()
    return resp.data or []


def create_campaign(data: Dict[str, Any], influencer_ids: Optional[List[str]] = None) -> Optional[Dict[str, Any]]:
    """
    Inserts a new campaign row. 
    Expects data["proposed_dates"] = {"start_date": "...", "end_date": "..."} → converts to a Postgres daterange.
    If influencer_ids is provided, create corresponding campaign_influencer rows (status='Pending').
    """
    insert_data = data.copy()
    pd = insert_data.pop("proposed_dates", None)
    if isinstance(pd, dict):
        start = pd.get("start_date")
        end = pd.get("end_date")
        insert_data["proposed_dates"] = f"[{start},{end}]"

    resp = supabase.table("campaign").insert(insert_data).execute()
    if not resp or not resp.data:
        return None

    created_campaign = resp.data[0]
    campaign_id = created_campaign.get("id")

    if influencer_ids:
        rows = []
        for infl_id in influencer_ids:
            rows.append({
                "campaign_id": campaign_id,
                "influencer_id": infl_id,
                "status": "Pending",
                "deliverables_submitted": {},
                "payment_status": False,
                "performance": None
            })
        supabase.table("campaign_influencer").insert(rows).execute()

    return created_campaign


def update_campaign(
    campaign_id: str,
    data: Dict[str, Any],
    influencer_ids: Optional[List[str]] = None
) -> Optional[Dict[str, Any]]:
    """
    Updates an existing campaign row. 
    If influencer_ids is non‐None, re‐sync the join table to exactly those influencers.
    """
    update_data = data.copy()
    update_data.pop("influencer_ids", None)

    pd = update_data.pop("proposed_dates", None)
    if isinstance(pd, dict):
        start = pd.get("start_date")
        end = pd.get("end_date")
        update_data["proposed_dates"] = f"[{start},{end}]"

    resp = (
        supabase
        .table("campaign")
        .update(update_data)
        .eq("id", campaign_id)
        .execute()
    )
    if not resp or not resp.data:
        return None

    updated_campaign = resp.data[0]

    if influencer_ids is not None:
        # Delete all existing join rows for this campaign
        supabase.table("campaign_influencer").delete().eq("campaign_id", campaign_id).execute()

        # Insert new join rows with status = "Pending"
        rows = []
        for infl_id in influencer_ids:
            rows.append({
                "campaign_id": campaign_id,
                "influencer_id": infl_id,
                "status": "Pending",
                "deliverables_submitted": {},
                "payment_status": False,
                "performance": None
            })
        if rows:
            supabase.table("campaign_influencer").insert(rows).execute()

    return updated_campaign


def delete_campaign(campaign_id: str) -> List[Dict[str, Any]]:
    """
    Deletes all campaign_influencer rows first, then deletes the campaign row.
    Returns the deleted campaign row(s) or [] if none.
    """
    supabase.table("campaign_influencer").delete().eq("campaign_id", campaign_id).execute()
    resp = supabase.table("campaign").delete().eq("id", campaign_id).execute()
    return resp.data or []


# ----- Campaign‐Influencer (Join Table) Read Operations -----


def get_campaigns_for_influencer(influencer_id: str) -> List[Dict[str, Any]]:
    """
    Returns all campaigns (with invite_status) for a given influencer.
    Merge the join‐table status into each campaign under "invite_status".
    """
    # 1) Query join‐table for (campaign_id, status)
    ji_resp = (
        supabase.table("campaign_influencer")
        .select("campaign_id, status")
        .eq("influencer_id", influencer_id)
        .execute()
    )
    if ji_resp is None or getattr(ji_resp, "error", None):
        raise RuntimeError(f"DB error when querying join table: {ji_resp.error.message if ji_resp and hasattr(ji_resp,'error') else 'None returned'}")

    join_rows = ji_resp.data or []
    if not join_rows:
        return []

    status_map: Dict[str, str] = {}
    campaign_ids: List[str] = []
    for jr in join_rows:
        cid = jr.get("campaign_id")
        st  = jr.get("status", "Pending")
        if cid:
            campaign_ids.append(cid)
            status_map[cid] = st

    # 2) Fetch those campaigns
    c_resp = (
        supabase.table("campaign")
        .select("*")
        .in_("id", campaign_ids)
        .execute()
    )
    if c_resp is None or getattr(c_resp, "error", None):
        raise RuntimeError(f"DB error when querying campaigns: {c_resp.error.message if c_resp and hasattr(c_resp,'error') else 'None returned'}")

    campaigns = c_resp.data or []
    result: List[Dict[str, Any]] = []
    for camp in campaigns:
        cid = camp.get("id")
        merged = {**camp, "invite_status": status_map.get(cid, "Pending")}
        result.append(merged)

    return result


def list_influencers_for_campaign(campaign_id: str) -> List[Dict[str, Any]]:
    """
    Returns a list of the invited influencers for this campaign, each with:
      { id, name, profile_picture_url, invite_status }.
    """
    join_rows = (
        supabase.table("campaign_influencer")
        .select("influencer_id, status")
        .eq("campaign_id", campaign_id)
        .execute()
    )
    if join_rows is None or getattr(join_rows, "error", None):
        return []

    result: List[Dict[str, Any]] = []
    for jr in join_rows.data or []:
        infl_id = jr.get("influencer_id")
        status  = jr.get("status", "Pending")
        # Fetch that influencer’s basic info
        inf_resp = (
            supabase.table("influencer")
            .select("id, name, profile_picture_url")
            .eq("id", infl_id)
            .single()
            .execute()
        )
        if inf_resp is None or getattr(inf_resp, "error", None) or not inf_resp.data:
            continue

        inf_data = inf_resp.data
        result.append({
            "id": inf_data["id"],
            "name": inf_data["name"],
            "profile_picture_url": inf_data.get("profile_picture_url"),
            "invite_status": status,
        })
    return result


def get_join_row(campaign_id: str, influencer_id: str) -> Optional[Dict[str, Any]]:
    """
    Returns the campaign_influencer row for this influencer+campaign, including:
      { status: str,
        deliverables_submitted: { [deliverable_type]: url, … },
        payment_status: bool,
        performance: { views, likes } or other metrics
      }
    """
    resp = (
        supabase.table("campaign_influencer")
        .select("status, deliverables_submitted, payment_status, performance, agreed_rate_per_post")
        .eq("campaign_id", campaign_id)
        .eq("influencer_id", influencer_id)
        .single()
        .execute()
    )
    if resp is None or getattr(resp, "error", None):
        return None
    return resp.data


def get_influencer_performance(campaign_id: str, influencer_id: str) -> Optional[Dict[str, Any]]:
    """
    Returns whatever JSON is stored in performance—for example:
      { "views": 1234, "likes": 56 }
    """
    resp = (
        supabase.table("campaign_influencer")
        .select("performance")
        .eq("campaign_id", campaign_id)
        .eq("influencer_id", influencer_id)
        .single()
        .execute()
    )
    if resp is None or getattr(resp, "error", None) or not resp.data:
        return None
    return resp.data.get("performance")


# ----- Campaign‐Influencer (Join Table) Write Operations -----


def invite_influencer_to_campaign(campaign_id: str, influencer_id: str) -> bool:
    """
    Inserts a new row into campaign_influencer with status="Pending", if none exists.
    Returns True if the row already existed or was successfully inserted.
    Raises on DB errors.
    """
    # 1) Check if that join row already exists
    existing = (
        supabase.table("campaign_influencer")
        .select("*")
        .eq("campaign_id", campaign_id)
        .eq("influencer_id", influencer_id)
        .execute()
    )
    if existing is None or getattr(existing, "error", None):
        raise RuntimeError(f"DB error when checking existing invite: {existing.error.message if existing and hasattr(existing,'error') else 'None returned'}")

    if existing.data and len(existing.data) > 0:
        # Already invited or joined
        return True

    # 2) Insert new join row with defaults
    new_row = {
        "campaign_id": campaign_id,
        "influencer_id": influencer_id,
        "status": "Pending",
        "deliverables_submitted": {},
        "payment_status": False,
        "performance": None
    }
    insert_resp = supabase.table("campaign_influencer").insert(new_row).execute()
    if insert_resp is None or getattr(insert_resp, "error", None):
        raise RuntimeError(f"DB error when inserting invite: {insert_resp.error.message if insert_resp and hasattr(insert_resp,'error') else 'None returned'}")

    return bool(insert_resp.data)


def accept_influencer_invitation(campaign_id: str, influencer_id: str) -> bool:
    """
    Updates an existing campaign_influencer row from status="Pending" to status="Accepted".
    Returns True if updated, False if no pending row was found.
    Raises on DB errors.
    """
    check = (
        supabase.table("campaign_influencer")
        .select("status")
        .eq("campaign_id", campaign_id)
        .eq("influencer_id", influencer_id)
        .single()
        .execute()
    )
    if check is None or getattr(check, "error", None):
        raise RuntimeError(
            f"DB error when looking up join row: "
            f"{check.error.message if check and hasattr(check, 'error') else 'None returned'}"
        )

    row = check.data or {}
    if row.get("status") != "Pending":
        return False

    update = (
        supabase.table("campaign_influencer")
        .update({"status": "Accepted"})
        .eq("campaign_id", campaign_id)
        .eq("influencer_id", influencer_id)
        .execute()
    )
    if update is None or getattr(update, "error", None):
        raise RuntimeError(
            f"DB error when accepting invite: "
            f"{update.error.message if update and hasattr(update, 'error') else 'None returned'}"
        )

    return bool(update.data)


def reject_influencer_invitation(campaign_id: str, influencer_id: str) -> bool:
    """
    Updates an existing campaign_influencer row from status="Pending" to status="Rejected".
    Returns True if updated, False if no pending row was found.
    Raises on DB errors.
    """
    check = (
        supabase.table("campaign_influencer")
        .select("status")
        .eq("campaign_id", campaign_id)
        .eq("influencer_id", influencer_id)
        .single()
        .execute()
    )
    if check is None or getattr(check, "error", None):
        raise RuntimeError(
            f"DB error when looking up join row: "
            f"{check.error.message if check and hasattr(check, 'error') else 'None returned'}"
        )

    row = check.data or {}
    if row.get("status") != "Pending":
        return False

    update = (
        supabase.table("campaign_influencer")
        .update({"status": "Rejected"})
        .eq("campaign_id", campaign_id)
        .eq("influencer_id", influencer_id)
        .execute()
    )
    if update is None or getattr(update, "error", None):
        raise RuntimeError(
            f"DB error when rejecting invite: "
            f"{update.error.message if update and hasattr(update, 'error') else 'None returned'}"
        )

    return bool(update.data)

def finalize_influencer_terms(
    campaign_id: str,
    influencer_id: str,
    agreed_rate: float,
    deliverable_details: str
) -> bool:
    """
    Update the campaign_influencer join row:
      - Set status = "Ready to Sign Contract"
      - Set rate_per_post = agreed_rate
      - Store final_deliverable_details in a JSONB field (or text column).
    Returns True if exactly one row was updated.
    """
    update_data = {
        "status": "Ready to Sign Contract",
        "agreed_rate_per_post": agreed_rate,
        # Assuming you added a text column `final_deliverable_details` to campaign_influencer
        "final_deliverable_details": deliverable_details,
    }
    resp = (
        supabase.table("campaign_influencer")
        .update(update_data)
        .eq("campaign_id", campaign_id)
        .eq("influencer_id", influencer_id)
        .execute()
    )
    if resp and not getattr(resp, "error", None) and resp.data:
        return True
    return False

def get_finalized_terms(campaign_id: str, influencer_id: str) -> Optional[Dict]:
    """
    Returns the agreed_rate_per_post and final_deliverable_details
    for this campaign+influencer join row. Returns None if not found.
    """
    resp = (
        supabase.table("campaign_influencer")
        .select("agreed_rate_per_post, final_deliverable_details")
        .eq("campaign_id", campaign_id)
        .eq("influencer_id", influencer_id)
        .single()
        .execute()
    )
    if resp and not getattr(resp, "error", None) and resp.data:
        return {
            "agreed_rate_per_post": resp.data.get("agreed_rate_per_post", 0),
            "final_deliverable_details": resp.data.get("final_deliverable_details", ""),
        }
    return None

def sign_contract_for_influencer(campaign_id: str, influencer_id: str) -> bool:
    """
    Updates campaign_influencer.status = "Signed" for the given pair.
    Returns True if exactly one row was updated.
    """
    resp = (
        supabase.table("campaign_influencer")
        .update({"status": "Signed"})
        .eq("campaign_id", campaign_id)
        .eq("influencer_id", influencer_id)
        .execute()
    )
    if resp and not getattr(resp, "error", None) and resp.data:
        return True
    return False