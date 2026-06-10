from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.services.logging_service import get_logger
from app.api.projects import router as projects_router
from app.api.analyze import router as analyze_router

logger = get_logger("MainApp")

app = FastAPI(
    title="ConstructaIQ Enterprise API",
    description="A multi-agent construction risk diagnostics engine powered by FastAPI and Azure AI Foundry Agents.",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(projects_router, prefix="/api")
app.include_router(analyze_router, prefix="/api")

@app.get("/healthz", tags=["Infrastructure"])
async def health_check():
    """Liveness probe."""
    return {"status": "healthy", "service": "ConstructaIQ"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
