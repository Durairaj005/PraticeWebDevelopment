from fastapi import APIRouter
from app.routers import auth, users, complaints, feedbacks, notifications

api_router = APIRouter()

@api_router.get("/health")
def health_check():
    return {"status": "ok", "message": "InsightOS Enterprise API is running"}

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(complaints.router, prefix="/complaints", tags=["complaints"])
api_router.include_router(feedbacks.router, prefix="/feedbacks", tags=["feedbacks"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
