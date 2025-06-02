# backend/app/routes/contract.py

from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional
from io import BytesIO
from fastapi.responses import StreamingResponse
from app.services.contract_service import generate_contract_with_terms

router = APIRouter(prefix="/api/contract", tags=["contract"])


@router.get("/generate", summary="Generate a PDF contract")
async def generate_contract_endpoint(
    campaign_id: str = Query(...),
    influencer_id: Optional[str] = Query(None)
):
    """
    GET /api/contract/generate?campaign_id={id}&influencer_id={infId}
    If influencer_id is provided, the service will pull in the finalized terms
    for that influencer/campaign—and produce a PDF. Otherwise, it may
    return a generic contract or an error.
    """
    try:
        pdf_bytes = generate_contract_with_terms(campaign_id, influencer_id)
        if not pdf_bytes:
            raise HTTPException(status_code=500, detail="Contract generation failed")

        buffer = BytesIO(pdf_bytes)
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="contract_{campaign_id}_{influencer_id}.pdf"'
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))