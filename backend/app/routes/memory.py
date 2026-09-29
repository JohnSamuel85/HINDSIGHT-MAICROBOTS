import logging
import time
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.models.schemas import (
    StoreMemoryRequest,
    StoreMemoryResponse,
    HistoricalMemoryItem
)
from app.services.hindsight_service import hindsight_service
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/memory", tags=["Memory"])


@router.post("", response_model=StoreMemoryResponse)
async def store_memory(request: StoreMemoryRequest):
    """
    Directly store an organizational memory into Hindsight.
    """
    case_id = request.case_id or f"MEM-{int(time.time())}"
    metadata = request.metadata or {}
    metadata.update({
        "case_id": case_id,
        "scenario": request.scenario,
        "outcome": request.outcome or "RESOLVED"
    })
    tags = [request.scenario.lower().replace(" ", "_"), "manual_entry"]

    try:
        await hindsight_service.retain_memory(
            content=request.content,
            document_id=case_id,
            metadata=metadata,
            tags=tags
        )
        return StoreMemoryResponse(
            status="success",
            case_id=case_id,
            message=f"Memory successfully retained in Hindsight bank '{settings.hindsight_bank_id}'."
        )
    except Exception as e:
        logger.error(f"Failed to store memory: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store memory: {str(e)}"
        )


@router.get("", response_model=List[HistoricalMemoryItem])
async def list_memories(
    query: str = Query("operational incident", description="Natural language search query"),
    scenario: Optional[str] = Query(None, description="Filter by scenario tag"),
    limit: int = Query(5, ge=1, le=20, description="Max memories to return")
):
    """
    Recall memories directly from Hindsight for inspection or exploration.
    """
    tags = [scenario.lower().replace(" ", "_")] if scenario else None
    try:
        memories = await hindsight_service.recall_memories(
            query=query,
            tags=tags,
            max_results=limit
        )
        return memories
    except Exception as e:
        logger.error(f"Failed to recall memories: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to recall memories: {str(e)}"
        )
