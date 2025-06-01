from fastapi import APIRouter, Query
from app.services.openai_service import get_creator_recommendations
from elasticsearch import Elasticsearch
import os

router = APIRouter()

# Initialize Elasticsearch client
es = Elasticsearch(
    hosts=[os.getenv("ELASTICSEARCH_URL", "https://localhost:9200")],
    basic_auth=("elastic", os.getenv("ELASTICSEARCH_PASSWORD", "NWZVgF9*6g_OsqiNlGy7")),
    verify_certs=False
)

@router.get("/creator/search")
def search_creators(prompt: str = Query(..., description="Marketing brief prompt")):
    summary = get_creator_recommendations(prompt)
    # Query Elasticsearch for creators matching the prompt in bio or categories
    resp = es.search(
        index="creators",
        query={
            "multi_match": {
                "query": prompt,
                "fields": ["bio", "categories"]
            }
        },
        size=10
    )
    creators = [hit["_source"] for hit in resp["hits"]["hits"]]
    return {
        "creators": creators,
        "gpt_summary": summary
    }