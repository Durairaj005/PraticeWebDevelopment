from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.db.base_class import Base
from app.db.session import engine
from app.core.config import settings
from app.routers.api_router import api_router
import app.models  # noqa: F401

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="InsightOS Enterprise Backend API",
    version="1.0.0"
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log exception here in a real production app
    return JSONResponse(
        status_code=500,
        content={"message": "An unexpected error occurred. Please try again later."},
    )


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Welcome to InsightOS Enterprise API"}

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}
