from fastapi import APIRouter, Query
from app.services.openai_service import get_creator_recommendations
from app.services.influencer_service import list_influencers

router = APIRouter()

@router.get("/creator/search")
def search_creators(prompt: str = Query(..., description="Marketing brief prompt")):
    summary = get_creator_recommendations(prompt)
    creators = list_influencers() or []
    return {
        "creators": creators,
        "gpt_summary": summary
    } 