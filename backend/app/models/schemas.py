from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):
    scenario: str = Field(..., description="The scenario type, e.g. 'API Timeout', 'Customer Escalation', 'Repeated Payment Failure'")
    problem_title: str = Field(..., description="Short title of the problem")
    problem_description: str = Field(..., description="Detailed description of the current incident")
    context: Optional[str] = Field(None, description="Operational context (e.g. peak traffic, multi-region sync)")
    symptoms: Optional[List[str]] = Field(default_factory=list, description="Observed operational symptoms")


class HistoricalMemoryItem(BaseModel):
    case_id: Optional[str] = None
    text: str
    scenario: Optional[str] = None
    outcome: Optional[str] = None  # "FAILED", "RESOLVED", etc.
    worked_or_failed: Optional[str] = None
    summary: Optional[str] = None


class AnalysisStep(BaseModel):
    id: str
    label: str
    detail: str
    status: str = "completed"  # pending, in_progress, completed, failed


class AnalysisResponse(BaseModel):
    scenario: str
    problem_title: str
    recommendation: str
    reasoning: str
    similar_cases: List[HistoricalMemoryItem] = Field(default_factory=list)
    failed_approaches: List[str] = Field(default_factory=list)
    successful_approaches: List[str] = Field(default_factory=list)
    root_causes: List[str] = Field(default_factory=list)
    steps: List[AnalysisStep] = Field(default_factory=list)
    new_memory_retained: bool = False
    retained_memory_summary: Optional[str] = None


class StoreMemoryRequest(BaseModel):
    scenario: str
    case_id: Optional[str] = None
    content: str
    outcome: Optional[str] = "RESOLVED"
    metadata: Optional[Dict[str, Any]] = None


class StoreMemoryResponse(BaseModel):
    status: str
    case_id: Optional[str] = None
    message: str


class HealthResponse(BaseModel):
    status: str
    hindsight_connected: bool
    gemini_configured: bool
    bank_id: str
    model: str
    version: str = "1.0.0"
