"""
Aegis Web Portal - FastAPI Application

This is the backend API server for the Aegis platform.
Handles authentication, subscriptions, and token management.
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import (
    check_status_router,
    checkout_router,
    tokens_router,
    webhook_router,
)
from app.config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

logger = logging.getLogger(__name__)
settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Aegis Web Portal - Subscription management and API gateway",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(check_status_router)
app.include_router(checkout_router)
app.include_router(webhook_router)
app.include_router(tokens_router)


@app.get("/")
async def root():
    """Root endpoint - health check"""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "healthy",
    }


@app.get("/health")
async def health():
    """Health check endpoint for load balancers"""
    return {"status": "ok"}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.exception(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
    )
