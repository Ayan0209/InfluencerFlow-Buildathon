# backend/app/routes/influencers_search.py

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

from app.services.influencer_service import list_influencers, search_influencers
from app.utils.es_client import es

router = APIRouter(
    prefix="/influencers-search",
    tags=["influencers-search"],
)

class SearchFilters(BaseModel):
    search: Optional[str] = None
    categories: Optional[List[str]] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    platforms: Optional[List[str]] = None
    followersMin: Optional[int] = None
    followersMax: Optional[int] = None
    engagementMin: Optional[float] = None
    engagementMax: Optional[float] = None
    rateMin: Optional[float] = None
    rateMax: Optional[float] = None
    availability: Optional[str] = None

@router.post("/")
async def influencer_search(filters: SearchFilters):
    """
    POST /api/influencers-search
    Returns {"influencers": [ ... ]} filtered by the provided criteria.
    If no filter fields are set, returns all influencers (capped at 50).
    """
    must_clauses = []
    filter_clauses = []

    # 1) Free-text search
    if filters.search:
        must_clauses.append({
            "multi_match": {
                "query": filters.search,
                "fields": ["name^2", "bio", "categories", "social_stats.platforms"],
                "fuzziness": "AUTO"
            }
        })

    # 2) Exact-match filters
    if filters.categories:
        filter_clauses.append({
            "terms": {"categories.keyword": filters.categories}
        })
    if filters.platforms:
        filter_clauses.append({
            "terms": {"social_stats.platforms.keyword": filters.platforms}
        })
    if filters.city:
        filter_clauses.append({
            "term": {"location.city.keyword": filters.city}
        })
    if filters.state:
        filter_clauses.append({
            "term": {"location.state.keyword": filters.state}
        })
    if filters.country:
        filter_clauses.append({
            "term": {"location.country.keyword": filters.country}
        })

    # 3) Numeric range filters
    if filters.followersMin is not None or filters.followersMax is not None:
        rng = {}
        if filters.followersMin is not None:
            rng["gte"] = filters.followersMin
        if filters.followersMax is not None:
            rng["lte"] = filters.followersMax
        filter_clauses.append({
            "range": {"social_stats.followers": rng}
        })

    if filters.rateMin is not None or filters.rateMax is not None:
        rng = {}
        if filters.rateMin is not None:
            rng["gte"] = filters.rateMin
        if filters.rateMax is not None:
            rng["lte"] = filters.rateMax
        filter_clauses.append({
            "range": {"rate_per_post": rng}
        })

    # (Add engagementMin/Max if you store engagement_rate under social_stats.)

    # 4) Build the final ES query
    if not must_clauses and not filter_clauses:
        es_query = {"match_all": {}}
    else:
        bool_body = {}
        if must_clauses:
            bool_body["must"] = must_clauses
        if filter_clauses:
            bool_body["filter"] = filter_clauses
        es_query = {"bool": bool_body}

    # 5) Execute the search
    try:
        response = es.search(
            index="creators",
            query=es_query,
            size=50  # return up to 50 matches
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Elasticsearch error: {e}")

    # 6) Map hits to their _source documents
    hits = response["hits"]["hits"]
    influencers = [hit["_source"] for hit in hits]
    return {"influencers": influencers}
