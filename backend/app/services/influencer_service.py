from app.services.supabase_client import supabase

def get_influencer_by_id(influencer_id: str):
    row = supabase.table("influencer").select("*").eq("id", influencer_id).single().execute()
    return row.data

def list_influencers():
    rows = supabase.table("influencer").select("*").execute()
    return rows.data

def create_influencer(data: dict):
    row = supabase.table("influencer").insert(data).single().execute()
    return row.data

def update_influencer(influencer_id: str, data: dict):
    row = supabase.table("influencer").update(data).eq("id", influencer_id).single().execute()
    return row.data

def delete_influencer(influencer_id: str):
    row = supabase.table("influencer").delete().eq("id", influencer_id).execute()
    return row.data 