# src/lib/es_client.py
from elasticsearch import Elasticsearch
import os
from dotenv import load_dotenv

# Resolve path to .env file in the backend root
dotenv_path = os.path.join(os.path.dirname(__file__), '../..', '.env')
load_dotenv(dotenv_path)

# Read environment variables (set these in your shell before running)
ES_NODE = os.getenv("ELASTICSEARCH_URL", "https://localhost:9200")
ES_USERNAME = os.getenv("ELASTICSEARCH_USER", "elastic")
ES_PASSWORD = os.getenv("ELASTICSEARCH_PASS", "InfluencerFlow")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print("ES_NODE: ", ES_NODE)
print("ES_USERNAME: ", ES_USERNAME)
print("ES_PASSWORD: ", ES_PASSWORD)

# Build the client. We pass `verify_certs=False` because locally
# Elasticsearch is using a self-signed cert. In production you’d set this to True.
es = Elasticsearch(
    [ES_NODE],
    basic_auth=(ES_USERNAME, ES_PASSWORD),
    verify_certs=False,
    headers={"Accept": "application/vnd.elasticsearch+json; compatible-with=8"}
)
