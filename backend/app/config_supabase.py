from dotenv import load_dotenv
import os
from supabase import create_client, Client

dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

print("SUPABASE_URL: ", SUPABASE_URL)
print("SUPABASE_SERVICE_KEY_updated: ", SUPABASE_SERVICE_KEY)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
