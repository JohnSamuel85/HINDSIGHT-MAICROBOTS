import json
import logging
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from app.models.schemas import AnalysisRequest, AnalysisResponse
from app.services.orchestration_service import orchestration_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analyze", tags=["Analysis"])


@router.post("", response_model=AnalysisResponse)
async def analyze_issue(request: AnalysisRequest):
    """
    Main orchestration endpoint.
    Recalls memories from Hindsight, reasons via Gemini, provides recommendations,
    and stores new experience into Hindsight.
    """
    try:
        response = await orchestration_service.execute_analysis_workflow(request)
        return response
    except Exception as e:
        logger.error(f"Analysis failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@router.post("/stream")
async def analyze_issue_stream(request: AnalysisRequest):
    """
    Server-Sent Events endpoint streaming real backend workflow progress
    in real-time as Hindsight and Gemini execute.
    """
    async def event_generator():
        try:
            async for event in orchestration_service.stream_analysis_workflow(request):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            logger.error(f"Stream analysis failed: {e}", exc_info=True)
            err_data = {"type": "error", "message": str(e)}
            yield f"data: {json.dumps(err_data)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
