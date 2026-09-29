import logging
import re
from typing import Any, Dict, List, Optional
from hindsight_client import Hindsight
from app.core.config import settings
from app.models.schemas import HistoricalMemoryItem

logger = logging.getLogger(__name__)


class HindsightService:
    def __init__(self):
        self.bank_id = settings.hindsight_bank_id
        self.base_url = settings.hindsight_endpoint
        self.api_key = settings.hindsight_api_key
        self._client: Optional[Hindsight] = None

    def get_client(self) -> Hindsight:
        if self._client is None:
            if not self.api_key:
                logger.warning("HINDSIGHT_API_KEY is not configured.")
            self._client = Hindsight(
                base_url=self.base_url,
                api_key=self.api_key
            )
        return self._client

    async def check_connection(self) -> bool:
        """Asynchronously check if Hindsight server is reachable and bank is accessible."""
        try:
            client = self.get_client()
            # Perform a lightweight recall query via arecall
            await client.arecall(bank_id=self.bank_id, query="operational health", max_tokens=100)
            return True
        except Exception as e:
            logger.error(f"Hindsight connection check failed: {e}")
            return False

    async def recall_memories(
        self,
        query: str,
        tags: Optional[List[str]] = None,
        max_results: int = 5
    ) -> List[HistoricalMemoryItem]:
        """
        Asynchronously recall relevant historical memories from Hindsight using multi-strategy search.
        """
        client = self.get_client()
        memories: List[HistoricalMemoryItem] = []

        try:
            recall_response = await client.arecall(
                bank_id=self.bank_id,
                query=query,
                tags=tags,
                max_tokens=4096,
                budget="mid"
            )

            raw_results = getattr(recall_response, "results", []) or []
            logger.info(f"Retrieved {len(raw_results)} memories from Hindsight for query: '{query}'")

            for item in raw_results[:max_results]:
                text = getattr(item, "text", "") or ""
                doc_id = getattr(item, "document_id", None)
                metadata = getattr(item, "metadata", {}) or {}

                # Extract case_id either from doc_id or metadata or regex
                case_id = doc_id or metadata.get("case_id")
                if not case_id:
                    match = re.search(r"(PAY-\d+|ESC-\d+|SUB-\d+|INC-[A-Z]+-\d+)", text)
                    if match:
                        case_id = match.group(1)

                # Extract outcome (FAILED vs RESOLVED)
                outcome = metadata.get("outcome")
                if not outcome:
                    if "FAILED" in text.upper() or "failed" in text.lower():
                        outcome = "FAILED"
                    elif "RESOLVED" in text.upper() or "resolved" in text.lower():
                        outcome = "RESOLVED"

                # Extract worked_or_failed
                worked_or_failed = metadata.get("worked_or_failed")
                if not worked_or_failed:
                    worked_or_failed = "Worked" if outcome == "RESOLVED" else "Failed"

                # Extract scenario
                scenario = metadata.get("scenario")

                # Build a crisp summary for UI display
                summary = ""
                if case_id and outcome:
                    first_line = text.split("\n")[0]
                    summary = f"[{case_id}] {first_line} — Outcome: {outcome}"
                else:
                    summary = text[:150] + ("..." if len(text) > 150 else "")

                memories.append(HistoricalMemoryItem(
                    case_id=case_id,
                    text=text,
                    scenario=scenario,
                    outcome=outcome,
                    worked_or_failed=worked_or_failed,
                    summary=summary
                ))

        except Exception as e:
            logger.error(f"Error during Hindsight recall: {e}", exc_info=True)
            raise

        return memories

    async def retain_memory(
        self,
        content: str,
        document_id: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None,
        tags: Optional[List[str]] = None
    ) -> bool:
        """
        Asynchronously store a new organizational memory into Hindsight.
        """
        client = self.get_client()
        try:
            await client.aretain(
                bank_id=self.bank_id,
                content=content,
                document_id=document_id,
                metadata=metadata,
                tags=tags,
                update_mode="replace"
            )
            logger.info(f"Successfully retained memory in Hindsight bank '{self.bank_id}'. Document ID: {document_id}")
            return True
        except Exception as e:
            logger.error(f"Error during Hindsight retain: {e}", exc_info=True)
            raise

    async def aclose(self):
        if self._client is not None:
            try:
                await self._client.aclose()
            except Exception:
                pass


hindsight_service = HindsightService()
