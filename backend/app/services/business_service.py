# backend/app/services/business_services.py

from app.services.supabase_client import supabase
from typing import List, Dict, Optional


def get_business_by_id(business_id: str) -> Optional[Dict]:
    resp = (
        supabase
        .table("business")
        .select("*")
        .eq("id", business_id)
        .single()
        .execute()
    )
    return resp.data if resp and not getattr(resp, "error", None) else None


def list_businesses() -> List[Dict]:
    resp = supabase.table("business").select("*").execute()
    return resp.data or []


def create_business(data: Dict) -> Optional[Dict]:
    resp = supabase.table("business").insert(data).single().execute()
    return resp.data if resp and not getattr(resp, "error", None) else None


def update_business(business_id: str, data: Dict) -> Optional[Dict]:
    resp = (
        supabase
        .table("business")
        .update(data)
        .eq("id", business_id)
        .single()
        .execute()
    )
    return resp.data if resp and not getattr(resp, "error", None) else None


def delete_business(business_id: str) -> Optional[List[Dict]]:
    resp = supabase.table("business").delete().eq("id", business_id).execute()
    return resp.data  # If no data returned, will be [] or None


def list_campaigns_for_business(business_id: str) -> List[Dict]:
    """
    Returns all campaigns where campaign.business_id == business_id.
    """
    resp = (
        supabase
        .table("campaign")
        .select("*")
        .eq("business_id", business_id)
        .execute()
    )
    return resp.data or []
