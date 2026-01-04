"""
FastAPI application entry point for the Todo Web Application.
This module provides:
- FastAPI app instance with CORS configuration
- Database initialization on startup
- Health check endpoint
- Task API routes (via router) - TEMPORARILY WITHOUT AUTH FOR HACKATHON DEMO
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

# Configure CORS - Perfect for Vercel + local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for hackathon demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Support Chrome Private Network Access
@app.middleware("http")
async def _allow_private_network(request: Request, call_next):
    response = await call_next(request)
    if request.headers.get("sec-private-network", "").lower() == "true":
        response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response

# 🔥 FINAL FIX: Correct router inclusion
# tasks_router already has prefix="/api/tasks" in tasks.py
# So we include it WITHOUT additional prefix to avoid double /api/tasks/api/tasks
app.include_router(tasks_router)  # ← No prefix here!

# If you want to be extra safe, you can explicitly set empty prefix
# app.include_router(tasks_router, prefix="")

# Auth routes (login, register etc.) - usually /api/auth or no prefix
app.include_router(auth_router)

# Chat route for AI assistant
app.include_router(chat_router)

# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check() -> dict:
    return {"status": "healthy", "version": "1.0.0"}

# Root endpoint
@app.get("/", tags=["root"])
async def root() -> dict:
    return {
        "message": "Todo Web Application API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal error occurred"},
    )
