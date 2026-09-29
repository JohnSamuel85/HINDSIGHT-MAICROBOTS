import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.models.schemas import HealthResponse
from app.routes import analysis, memory
from app.services.hindsight_service import hindsight_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Organizational Memory & Reasoning System API...")
    logger.info(f"Target Hindsight Bank: '{settings.hindsight_bank_id}' at {settings.hindsight_endpoint}")
    logger.info(f"Gemini Model: '{settings.gemini_model}'")
    yield
    logger.info("Shutting down API and closing Hindsight client sessions...")
    await hindsight_service.aclose()


app = FastAPI(
    title="Organizational Memory & Reasoning System API",
    description="AI-powered business problem-solving system pairing Hindsight persistent memory with Google Gemini reasoning.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend
origins = [
    settings.frontend_url,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(analysis.router)
app.include_router(memory.router)


@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Returns backend health status, verifying Hindsight connection and Gemini configuration.
    """
    hindsight_ok = False
    try:
        hindsight_ok = await hindsight_service.check_connection()
    except Exception as e:
        logger.warning(f"Hindsight health check check failed: {e}")

    gemini_ok = bool(settings.gemini_api_key)

    return HealthResponse(
        status="healthy" if (hindsight_ok and gemini_ok) else "degraded",
        hindsight_connected=hindsight_ok,
        gemini_configured=gemini_ok,
        bank_id=settings.hindsight_bank_id,
        model=settings.gemini_model,
        version="1.0.0"
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=True
    )
