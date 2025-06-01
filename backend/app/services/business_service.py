from app.services.supabase_client import supabase

def get_business_by_id(business_id: str):
    row = supabase.table("business").select("*").eq("id", business_id).single().execute()
    return row.data

def list_businesses():
    rows = supabase.table("business").select("*").execute()
    return rows.data

def create_business(data: dict):
    row = supabase.table("business").insert(data).single().execute()
    return row.data

def update_business(business_id: str, data: dict):
    row = supabase.table("business").update(data).eq("id", business_id).single().execute()
    return row.data

def delete_business(business_id: str):
    row = supabase.table("business").delete().eq("id", business_id).execute()
    return row.data
