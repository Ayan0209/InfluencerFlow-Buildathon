from fastapi import APIRouter, Query
from app.services.openai_service import get_creator_recommendations
from app.utils.mock_data import MOCK_CREATORS

router = APIRouter()

@router.get("/creator/search")
def search_creators(prompt: str = Query(..., description="Marketing brief prompt")):
    summary = get_creator_recommendations(prompt)
    return {
        "creators": MOCK_CREATORS,
        "gpt_summary": summary
    } 