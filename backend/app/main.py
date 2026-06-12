from contextlib import asynccontextmanager

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config.settings import settings
from app.db import check_db, dispose_db, init_db
from app.services.logging_service import get_logger
from app.api.analyze import router as analyze_router
from app.api.catalogs import router as catalogs_router
from app.api.projects import router as projects_router

logger = get_logger("MainApp")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await dispose_db()


app = FastAPI(
    title="ConstructaIQ Enterprise API",
    description="A multi-agent construction risk diagnostics engine powered by FastAPI and Azure AI Foundry Agents.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers (/api and /api/v1 alias for frontend contract)
for api_prefix in ("/api", "/api/v1"):
    app.include_router(projects_router, prefix=api_prefix)
    app.include_router(analyze_router, prefix=api_prefix)
    app.include_router(catalogs_router, prefix=api_prefix)


@app.get("/healthz", tags=["Infrastructure"])
async def health_check():
    """Liveness probe."""
    return {"status": "healthy", "service": "ConstructaIQ"}


@app.get("/healthz/db", tags=["Infrastructure"])
async def health_check_db():
    """Database connectivity probe."""
    result = await check_db()
    if result["status"] != "healthy":
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=result,
        )
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
