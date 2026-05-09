from pathlib import Path
import sys

# Allow running this file directly (python backend/app/main.py)
# by ensuring the `backend` directory is on sys.path so `import app` works.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, student, admin, comparison, batch_subjects
from app.db.database import init_db
import logging

# Reduce SQLAlchemy verbosity (PRAGMA / raw SQL logs)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy").setLevel(logging.WARNING)

app = FastAPI(
    title="EduAnalytics API",
    description="Complete analytics platform for educational institutions",
    version="1.0.0"
)


@app.on_event("startup")
def on_startup():
    """Initialize resources on startup."""
    init_db()

# Add CORS middleware FIRST (before routers)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers AFTER middleware
app.include_router(auth.router)
app.include_router(student.router)
app.include_router(admin.router)
app.include_router(comparison.router)
app.include_router(batch_subjects.router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "status": "ok",
        "service": "EduAnalytics API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "EduAnalytics",
        "timestamp": "2024-12-16T00:00:00Z"
    }
