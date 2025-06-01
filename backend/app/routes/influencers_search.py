# backend/app/routes/influencers_search.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.influencer_service import list_influencers

router = APIRouter(tags=["influencers-search"])


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


@router.post("/influencers-search")
async def search_influencers(filters: SearchFilters):
    """
    POST /influencers-search
    Fetch all influencers via service, then apply in-memory filters.
    """
    all_influencers = list_influencers() or []

    # If no filters provided, return everything
    if not any([
        filters.search,
        filters.categories,
        filters.city,
        filters.state,
        filters.country,
        filters.platforms,
        filters.followersMin is not None,
        filters.followersMax is not None,
        filters.engagementMin is not None,
        filters.engagementMax is not None,
        filters.rateMin is not None,
        filters.rateMax is not None,
        filters.availability,
    ]):
        return {"influencers": all_influencers}

    def matches(inf: dict) -> bool:
        # 1) Name/Username search (case-insensitive)
        if filters.search:
            term = filters.search.lower()
            if term not in inf.get("name", "").lower() and term not in inf.get("username", "").lower():
                return False

        # 2) Categories subset
        if filters.categories:
            inf_cats = inf.get("categories") or []
            if not set(filters.categories).issubset(set(inf_cats)):
                return False

        # 3) Location
        loc = inf.get("location") or {}
        if filters.city and loc.get("city", "").lower() != filters.city.lower():
            return False
        if filters.state and loc.get("state", "").lower() != filters.state.lower():
            return False
        if filters.country and loc.get("country", "").lower() != filters.country.lower():
            return False

        # 4) Availability
        if filters.availability:
            if (inf.get("availability") or "").lower() != filters.availability.lower():
                return False

        # 5) Platform-specific filters (example: Instagram)
        sm = inf.get("social_media") or {}
        ig = sm.get("instagram") or {}
        if filters.platforms and "instagram" in filters.platforms:
            if filters.followersMin is not None and (ig.get("followers") or 0) < filters.followersMin:
                return False
            if filters.followersMax is not None and (ig.get("followers") or 0) > filters.followersMax:
                return False
            if filters.engagementMin is not None and (ig.get("engagement_rate") or 0) < filters.engagementMin:
                return False
            if filters.engagementMax is not None and (ig.get("engagement_rate") or 0) > filters.engagementMax:
                return False

        # 6) Rate per post
        if filters.rateMin is not None and (inf.get("rate_per_post") or 0) < filters.rateMin:
            return False
        if filters.rateMax is not None and (inf.get("rate_per_post") or 0) > filters.rateMax:
            return False

        return True

    filtered = [inf for inf in all_influencers if matches(inf)]
    return {"influencers": filtered}
