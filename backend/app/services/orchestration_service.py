import datetime
import logging
import time
from typing import AsyncGenerator, Dict, Any, List
from app.models.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    AnalysisStep,
    HistoricalMemoryItem
)
from app.services.hindsight_service import hindsight_service
from app.services.gemini_service import gemini_service
from app.core.config import settings

logger = logging.getLogger(__name__)


class OrchestrationService:
    def __init__(self):
        pass

    async def execute_analysis_workflow(
        self,
        request: AnalysisRequest
    ) -> AnalysisResponse:
        """
        Executes the full orchestration workflow:
        1. Classify & Understand Issue
        2. Query Hindsight for relevant organizational memory
        3. Send issue + memories to Gemini for reasoning
        4. Synthesize recommendation & reasoning
        5. Retain new incident experience back into Hindsight
        """
        steps: List[AnalysisStep] = []

        # Step 1: Understand / Classify
        steps.append(AnalysisStep(
            id="step-1",
            label="Understanding the issue...",
            detail=f"Classified scenario as '{request.scenario}' for '{request.problem_title}'.",
            status="completed"
        ))

        # Step 2: Query Hindsight
        search_query = f"{request.scenario} {request.problem_title} {request.problem_description}"
        tags = [request.scenario.lower().replace(" ", "_")]

        steps.append(AnalysisStep(
            id="step-2",
            label="Searching organizational memory...",
            detail=f"Querying Hindsight bank '{settings.hindsight_bank_id}' with multi-strategy retrieval.",
            status="completed"
        ))

        retrieved_memories = await hindsight_service.recall_memories(
            query=search_query,
            tags=tags,
            max_results=4
        )

        # Fallback to broader query if tag was too restrictive
        if not retrieved_memories:
            retrieved_memories = await hindsight_service.recall_memories(
                query=search_query,
                tags=None,
                max_results=4
            )

        steps.append(AnalysisStep(
            id="step-3",
            label="Hindsight found relevant memories...",
            detail=f"Retrieved {len(retrieved_memories)} historical precedents (including past failures and fixes).",
            status="completed"
        ))

        # Step 3: Send to Gemini for reasoning
        steps.append(AnalysisStep(
            id="step-4",
            label="Sending historical context to Gemini...",
            detail=f"Providing current incident context + {len(retrieved_memories)} Hindsight memories to {settings.gemini_model}.",
            status="completed"
        ))

        steps.append(AnalysisStep(
            id="step-5",
            label="Gemini is reasoning...",
            detail="Synthesizing historical patterns, evaluating past failures, and formulating recommendation.",
            status="completed"
        ))

        reasoning_result = gemini_service.reason_over_memories(
            request=request,
            memories=retrieved_memories
        )

        steps.append(AnalysisStep(
            id="step-6",
            label="Recommendation generated...",
            detail="Actionable recommendation formulated from historical precedent.",
            status="completed"
        ))

        # Step 4: Retain new experience back to Hindsight
        new_memory_retained = False
        retained_summary = None
        new_doc_id = f"INC-{int(time.time())}"

        try:
            new_content = (
                f"Incident Record: {new_doc_id}\n"
                f"Scenario: {request.scenario}\n"
                f"Problem: {request.problem_title} - {request.problem_description}\n"
                f"Context: {request.context or 'General'}\n"
                f"Recommendation Provided: {reasoning_result.get('recommendation', '')}\n"
                f"Institutional Rationale: {reasoning_result.get('reasoning', '')}\n"
                f"Precedents Cited: {', '.join(reasoning_result.get('key_precedent_case_ids', []))}"
            )

            await hindsight_service.retain_memory(
                content=new_content,
                document_id=new_doc_id,
                metadata={
                    "case_id": new_doc_id,
                    "scenario": request.scenario,
                    "outcome": "ANALYZED",
                    "source": "live_session"
                },
                tags=[request.scenario.lower().replace(" ", "_"), "live_session"]
            )
            new_memory_retained = True
            retained_summary = f"Recorded new case [{new_doc_id}] into Hindsight bank '{settings.hindsight_bank_id}'."

            steps.append(AnalysisStep(
                id="step-7",
                label="Saving useful experience to memory...",
                detail=retained_summary,
                status="completed"
            ))

        except Exception as e:
            logger.warning(f"Could not retain new experience in Hindsight: {e}")
            steps.append(AnalysisStep(
                id="step-7",
                label="Saving useful experience to memory...",
                detail=f"Skipped retaining memory: {str(e)}",
                status="failed"
            ))

        # Filter top 1-2 memories for the user's result view
        highlighted_memories: List[HistoricalMemoryItem] = []
        precedent_ids = reasoning_result.get("key_precedent_case_ids", [])

        for mem in retrieved_memories:
            if mem.case_id and mem.case_id in precedent_ids and mem not in highlighted_memories:
                highlighted_memories.append(mem)

        has_failed = any(m.outcome == "FAILED" for m in highlighted_memories)
        has_resolved = any(m.outcome == "RESOLVED" for m in highlighted_memories)

        if not has_failed:
            for mem in retrieved_memories:
                if mem.outcome == "FAILED" and mem not in highlighted_memories:
                    highlighted_memories.append(mem)
                    break

        if not has_resolved:
            for mem in retrieved_memories:
                if mem.outcome == "RESOLVED" and mem not in highlighted_memories:
                    highlighted_memories.append(mem)
                    break

        for mem in retrieved_memories:
            if len(highlighted_memories) >= 2:
                break
            if mem not in highlighted_memories:
                highlighted_memories.append(mem)

        return AnalysisResponse(
            scenario=request.scenario,
            problem_title=request.problem_title,
            recommendation=reasoning_result.get("recommendation", "Investigate database pool saturation."),
            reasoning=reasoning_result.get("reasoning", "Based on prior incidents, addressing root contention is required."),
            similar_cases=highlighted_memories[:2],
            failed_approaches=reasoning_result.get("failed_approaches", []),
            successful_approaches=reasoning_result.get("successful_approaches", []),
            root_causes=reasoning_result.get("root_causes", []),
            steps=steps,
            new_memory_retained=new_memory_retained,
            retained_memory_summary=retained_summary
        )

    async def stream_analysis_workflow(
        self,
        request: AnalysisRequest
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Streams real-time execution steps as Server-Sent Events (SSE).
        """
        # Step 1
        yield {
            "type": "step",
            "step": {
                "id": "step-1",
                "label": "Understanding the issue...",
                "detail": f"Classifying problem: '{request.problem_title}' in '{request.scenario}' domain.",
                "status": "in_progress"
            }
        }

        # Step 2
        search_query = f"{request.scenario} {request.problem_title} {request.problem_description}"
        tags = [request.scenario.lower().replace(" ", "_")]

        yield {
            "type": "step",
            "step": {
                "id": "step-2",
                "label": "Searching organizational memory...",
                "detail": f"Scanning Hindsight memory bank '{settings.hindsight_bank_id}' for previous incidents...",
                "status": "in_progress"
            }
        }

        retrieved_memories = await hindsight_service.recall_memories(
            query=search_query,
            tags=tags,
            max_results=4
        )
        if not retrieved_memories:
            retrieved_memories = await hindsight_service.recall_memories(
                query=search_query,
                tags=None,
                max_results=4
            )

        # Step 3
        yield {
            "type": "step",
            "step": {
                "id": "step-3",
                "label": "Hindsight found relevant memories...",
                "detail": f"Located {len(retrieved_memories)} organizational memories spanning both failed remediations and verified fixes.",
                "status": "in_progress"
            }
        }

        # Step 4
        yield {
            "type": "step",
            "step": {
                "id": "step-4",
                "label": "Sending historical context to Gemini...",
                "detail": f"Packaging incident symptoms and {len(retrieved_memories)} historical memories for {settings.gemini_model}...",
                "status": "in_progress"
            }
        }

        # Step 5
        yield {
            "type": "step",
            "step": {
                "id": "step-5",
                "label": "Gemini is reasoning...",
                "detail": "Gemini is comparing failed actions vs verified resolutions...",
                "status": "in_progress"
            }
        }

        reasoning_result = gemini_service.reason_over_memories(
            request=request,
            memories=retrieved_memories
        )

        # Step 6
        yield {
            "type": "step",
            "step": {
                "id": "step-6",
                "label": "Recommendation generated...",
                "detail": "Synthesized institutional guidance based on past outcomes.",
                "status": "in_progress"
            }
        }

        # Step 7
        new_doc_id = f"INC-{int(time.time())}"
        new_memory_retained = False
        retained_summary = None

        yield {
            "type": "step",
            "step": {
                "id": "step-7",
                "label": "Saving useful experience to memory...",
                "detail": f"Retaining case [{new_doc_id}] into Hindsight bank '{settings.hindsight_bank_id}'...",
                "status": "in_progress"
            }
        }

        try:
            new_content = (
                f"Incident Record: {new_doc_id}\n"
                f"Scenario: {request.scenario}\n"
                f"Problem: {request.problem_title} - {request.problem_description}\n"
                f"Context: {request.context or 'General'}\n"
                f"Recommendation Provided: {reasoning_result.get('recommendation', '')}\n"
                f"Institutional Rationale: {reasoning_result.get('reasoning', '')}\n"
                f"Precedents Cited: {', '.join(reasoning_result.get('key_precedent_case_ids', []))}"
            )

            await hindsight_service.retain_memory(
                content=new_content,
                document_id=new_doc_id,
                metadata={
                    "case_id": new_doc_id,
                    "scenario": request.scenario,
                    "outcome": "ANALYZED",
                    "source": "live_session"
                },
                tags=[request.scenario.lower().replace(" ", "_"), "live_session"]
            )
            new_memory_retained = True
            retained_summary = f"Experience saved to Hindsight as [{new_doc_id}]."
        except Exception as e:
            logger.warning(f"Failed to retain live experience: {e}")
            retained_summary = "Memory retention skipped."

        # Filter top 1-2 memories for final display
        highlighted_memories: List[HistoricalMemoryItem] = []
        precedent_ids = reasoning_result.get("key_precedent_case_ids", [])
        for mem in retrieved_memories:
            if mem.case_id and mem.case_id in precedent_ids and mem not in highlighted_memories:
                highlighted_memories.append(mem)

        has_failed = any(m.outcome == "FAILED" for m in highlighted_memories)
        has_resolved = any(m.outcome == "RESOLVED" for m in highlighted_memories)

        if not has_failed:
            for mem in retrieved_memories:
                if mem.outcome == "FAILED" and mem not in highlighted_memories:
                    highlighted_memories.append(mem)
                    break

        if not has_resolved:
            for mem in retrieved_memories:
                if mem.outcome == "RESOLVED" and mem not in highlighted_memories:
                    highlighted_memories.append(mem)
                    break

        for mem in retrieved_memories:
            if len(highlighted_memories) >= 2:
                break
            if mem not in highlighted_memories:
                highlighted_memories.append(mem)

        final_response = AnalysisResponse(
            scenario=request.scenario,
            problem_title=request.problem_title,
            recommendation=reasoning_result.get("recommendation", ""),
            reasoning=reasoning_result.get("reasoning", ""),
            similar_cases=highlighted_memories[:2],
            failed_approaches=reasoning_result.get("failed_approaches", []),
            successful_approaches=reasoning_result.get("successful_approaches", []),
            root_causes=reasoning_result.get("root_causes", []),
            steps=[
                AnalysisStep(id="step-1", label="Understanding the issue...", detail="Classified scenario.", status="completed"),
                AnalysisStep(id="step-2", label="Searching organizational memory...", detail=f"Queried Hindsight bank '{settings.hindsight_bank_id}'.", status="completed"),
                AnalysisStep(id="step-3", label="Hindsight found relevant memories...", detail=f"Found {len(retrieved_memories)} precedents.", status="completed"),
                AnalysisStep(id="step-4", label="Sending historical context to Gemini...", detail=f"Prepared prompt for {settings.gemini_model}.", status="completed"),
                AnalysisStep(id="step-5", label="Gemini is reasoning...", detail="Reasoned over precedents.", status="completed"),
                AnalysisStep(id="step-6", label="Recommendation generated...", detail="Synthesized guidance.", status="completed"),
                AnalysisStep(id="step-7", label="Saving useful experience to memory...", detail=retained_summary or "Memory updated.", status="completed" if new_memory_retained else "failed")
            ],
            new_memory_retained=new_memory_retained,
            retained_memory_summary=retained_summary
        )

        yield {
            "type": "complete",
            "data": final_response.model_dump()
        }


orchestration_service = OrchestrationService()
