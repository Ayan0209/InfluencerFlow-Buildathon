# backend/app/routes/influencer_recommendations.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.openai_service import get_creator_recommendations

router = APIRouter(prefix="/api/influencers-recommend", tags=["influencers-recommend"])

class Influencer(BaseModel):
    id: str
    name: str
    username: str
    bio: str
    categories: List[str] = []
    rate_per_post: float = 0.0
    # include any other fields you care about; or use Dict[str, Any] if you want everything
    social_media: Dict[str, Any] = {}
    location: Dict[str, Any] = {}

class RecommendRequest(BaseModel):
    campaignId: str
    influencers: List[Influencer]

@router.post("/")
async def recommend_creators(req: RecommendRequest):
    """
    Accepts:
      {
        "campaignId": "1234-abcd-...",
        "influencers": [ { id, name, username, bio, categories, rate_per_post, social_media, location }, … ]
      }
    Returns:
      { "recommendation": "…GPT’s summary text…" }
    """
    # 1) Build a prompt for GPT
    #    For simplicity, we’ll just dump the influencers as JSON and ask GPT to summarize.
    try:
        # Convert the list of influencers into a JSON‐string snippet
        influencers_json = []
        for inf in req.influencers:
            # Pick only a few fields for the prompt
            influencers_json.append({
                "id": inf.id,
                "name": inf.name,
                "bio": inf.bio,
                "categories": inf.categories,
                "rate_per_post": inf.rate_per_post,
                "location": inf.location,
                "social_media": inf.social_media
            })
        prompt = (
            f"Here is a list of {len(influencers_json)} influencers (id, name, bio, categories, rate_per_post, "
            f"location, social_media) for campaign {req.campaignId}:\n\n"
            f"{influencers_json}\n\n"
            "As a marketing expert, please write a brief summary (2–3 sentences) recommending why each influencer "
            "would be a good fit for the campaign. "
            "Return a short paragraph for each, prefaced by their name. "
        )
        # 2) Call your OpenAI helper
        summary = get_creator_recommendations(prompt)
        return {"recommendation": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI error: {e}")
