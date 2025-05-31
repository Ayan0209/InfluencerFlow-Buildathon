from app.config_supabase import supabase

def get_campaign_by_id(campaign_id: str):
    row = supabase.table("campaign").select("*").eq("id", campaign_id).single().execute()
    return row.data

def list_campaigns():
    rows = supabase.table("campaign").select("*").execute()
    return rows.data

def create_campaign(data: dict):
    row = supabase.table("campaign").insert(data).single().execute()
    return row.data

def update_campaign(campaign_id: str, data: dict):
    row = supabase.table("campaign").update(data).eq("id", campaign_id).single().execute()
    return row.data

def delete_campaign(campaign_id: str):
    row = supabase.table("campaign").delete().eq("id", campaign_id).execute()
    return row.data 