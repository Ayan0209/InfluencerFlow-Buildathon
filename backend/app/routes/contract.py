# backend/app/routes/contract.py

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Dict
from io import BytesIO

from fastapi.responses import StreamingResponse
from app.services.contract_service import generate_contract

router = APIRouter()


class ContractRequest(BaseModel):
    campaign_id: int
    creator_id: int
    terms: Dict[str, str]
    # e.g. {"brand_name": "...", "creator_name": "...", "deliverables": "...", "rate": "...", "timeline": "...", "milestone": "..."}


@router.post(
    "/contract/generate",
    summary="Generate a contract",
    response_description="Returns the rendered contract as a downloadable Markdown file",
)
async def create_contract(request: ContractRequest):
    """
    Generate a contract based on the provided campaign_id, creator_id, and terms.
    This endpoint returns a StreamingResponse containing the rendered contract bytes.
    """
    try:
        # Call your service to get back rendered contract bytes (UTF-8)
        contract_bytes: bytes = generate_contract(
            campaign_id=request.campaign_id,
            creator_id=request.creator_id,
            terms=request.terms,
        )

        # Wrap bytes in an in-memory buffer
        buffer = BytesIO(contract_bytes)

        # Return as a streaming response. Here, we use text/markdown. 
        # Change media_type to "application/pdf" if you switch to PDF bytes later.
        return StreamingResponse(
            buffer,
            media_type="text/markdown",
            headers={
                "Content-Disposition": "attachment; filename=contract.md"
            },
        )
    except Exception as e:
        # If anything goes wrong in generate_contract(), return an HTTP 500
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate contract: {e}"
        )
