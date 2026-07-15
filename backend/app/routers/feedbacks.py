from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user
from app.models.user import User, UserRole
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate, FeedbackRead

router = APIRouter()

@router.post("/", response_model=FeedbackRead)
def create_feedback(
    *,
    db: Session = Depends(get_db),
    feedback_in: FeedbackCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create new feedback.
    """
    if current_user.role != UserRole.student:
        raise HTTPException(status_code=403, detail="Only students can submit feedback.")
        
    feedback = Feedback(
        student_id=current_user.id,
        feedback_type=feedback_in.feedback_type,
        content=feedback_in.content,
        is_anonymous=feedback_in.is_anonymous,
        subject_id=feedback_in.subject_id,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback
