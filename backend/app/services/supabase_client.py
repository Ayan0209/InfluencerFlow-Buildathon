# backend/app/services/supabase_client.py

from dotenv import load_dotenv
import os
from supabase import create_client, Client

# Load the .env file (one level up from /services)
dotenv_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(dotenv_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# (Optional) sanity check in server logs
print("SUPABASE_URL:", SUPABASE_URL)
# Avoid printing the service key in logs—only do so in development if absolutely necessary.
print("SUPABASE_SERVICE_KEY:", SUPABASE_SERVICE_KEY)

# Create a single Supabase client using your service_role key
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
