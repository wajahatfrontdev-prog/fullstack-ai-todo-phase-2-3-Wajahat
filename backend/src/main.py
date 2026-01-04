"""
FastAPI application entry point for the Todo Web Application.

This module provides:
- FastAPI app instance with CORS configuration
- Database initialization on startup
- Health check endpoint
- Task API routes (via router)
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .db import get_db, init_db, close_db, verify_database_connection
from .routes.tasks import router as tasks_router
from .routes.auth_simple import router as auth_router
from .routes.chat import router as chat_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler for startup and shutdown events.

    On startup:
    - Start server immediately (database connects lazily on first request)

    On shutdown:
    - Close database connections
    """
    logger.info("Starting Todo Web Application...")
    logger.info("Database will connect on first request (lazy initialization)")
    logger.info("Application startup complete")
    yield
    logger.info("Shutting down Todo Web Application...")
    try:
        await close_db()
    except Exception as e:
        logger.warning(f"Error during shutdown: {e}")
    logger.info("Application shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="Todo Web Application API",
    description="REST API for multi-user todo management",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS for frontend origin
CORS_ORIGINS: list[str] = [
    "http://localhost:3000",  # Next.js development server
    "http://127.0.0.1:3000",
    "http://localhost:3001",  # Alternate port
    "http://127.0.0.1:3001",
    "https://animated-fortnight-v6g4657xxw572w47j-3000.app.github.dev",  # Codespace frontend
    "https://animated-fortnight-v6g4657xxw572w47j-3001.app.github.dev",
    "https://animated-journey-jj46jgwxxw9jcgr5-3000.app.github.dev",  # Current frontend URL
    "https://redesigned-guide-r45w6jg4px56hr5p-3000.app.github.dev",  # Updated frontend URL
    "https://simple-q7ez.vercel.app",  # Vercel frontend
    "*",  # Allow all for development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Support Chrome Private Network Access (PNA) preflight from public websites
# When a public site tries to access a private address (like localhost), modern
# browsers send Sec-Private-Network: true in the preflight request. The server
# must reply with Access-Control-Allow-Private-Network: true for the request
# to be allowed. Add a small middleware to echo this when present.

@app.middleware("http")
async def _allow_private_network(request: Request, call_next):
    response = await call_next(request)
    if request.headers.get("sec-private-network", "").lower() == "true":
        response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response

# Include task routes from router
app.include_router(tasks_router)
app.include_router(auth_router)
app.include_router(chat_router)


# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check() -> dict:
    """
    Health check endpoint for service monitoring.

    Returns:
        dict: Service status and version
    """
    return {"status": "healthy", "version": "1.0.0"}


# Root endpoint
@app.get("/", tags=["root"])
async def root() -> dict:
    """
    Root endpoint for API information.

    Returns:
        dict: API information and available endpoints
    """
    return {
        "message": "Todo Web Application API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


# Global exception handler for unhandled errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Global exception handler for unhandled errors.

    Returns a generic error response to avoid leaking implementation details.
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal error occurred"},
    )
