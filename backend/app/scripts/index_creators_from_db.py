# backend/app/scripts/index_creators_from_db.py

import os
import sys

# 1) Compute the path to the “backend” folder (two levels up from this script).
current_dir = os.path.dirname(__file__)             # …/backend/app/scripts
backend_dir = os.path.abspath(os.path.join(current_dir, ".."))  # …/backend/app
project_root = os.path.abspath(os.path.join(current_dir, "..", ".."))  # …/backend

# 2) Insert “project_root” (so Python sees “app” as a top-level package)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Now “import app.services.supabase_client” will work, because “app/” is found under project_root/backend/app/.
from app.utils.es_client import es      # if es_client is at backend/app/utils/es_client.py
from app.services.influencer_service import list_influencers

import asyncio

async def main():
    influencers = list_influencers() or []
    print(f"Fetched {len(influencers)} influencers from Supabase.")
    for infl in influencers:
        doc_id = str(infl.get("id", ""))
        if not doc_id:
            print("Skipping a record without an 'id':", infl)
            continue
        try:
            es.index(index="creators", id=doc_id, document=infl)
            print(f"Indexed influencer {doc_id}")
        except Exception as e:
            print(f"Error indexing influencer {doc_id}:", e)
    print("Finished indexing influencers from Supabase into Elasticsearch.")

if __name__ == "__main__":
    asyncio.run(main())
