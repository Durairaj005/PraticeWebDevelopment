from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user, get_current_hod_or_admin
from app.models.user import User, UserRole
from app.models.complaint import Complaint
from app.schemas.complaint import ComplaintCreate, ComplaintRead, ComplaintUpdate
from app.schemas.ai_analysis import AIAnalysisRead
from app.models.ai_analysis import AIAnalysis
from app.models.notification import Notification, NotificationType
from app.services.ai_agent import analyze_complaint

router = APIRouter()

@router.post("/", response_model=ComplaintRead)
def create_complaint(
    *,
    db: Session = Depends(get_db),
    complaint_in: ComplaintCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create new complaint.
    """
    if current_user.role != UserRole.student:
        raise HTTPException(status_code=403, detail="Only students can submit complaints.")
        
    complaint = Complaint(
        student_id=current_user.id,
        title=complaint_in.title,
        description=complaint_in.description,
        category=complaint_in.category,
        is_anonymous=complaint_in.is_anonymous,
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    # Trigger background AI Analysis
    background_tasks.add_task(analyze_complaint, db, complaint.id)
    
    return complaint

@router.get("/me", response_model=List[ComplaintRead])
def read_own_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get current user's complaints.
    """
    complaints = db.query(Complaint).filter(Complaint.student_id == current_user.id).all()
    return complaints

@router.get("/all", response_model=List[ComplaintRead])
def read_all_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_hod_or_admin),
) -> Any:
    """
    Get all complaints across the system (HOD/Admin only).
    """
    complaints = db.query(Complaint).all()
    return complaints

from sqlalchemy import func
@router.get("/stats", response_model=Any)
def get_complaint_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get complaint statistics for the dashboard.
    (In a real app, restrict this to Super Admin. For demo, allowing active users).
    """
    total = db.query(Complaint).count()
    
    # Status distribution
    status_counts = db.query(Complaint.status, func.count(Complaint.id))\
        .group_by(Complaint.status).all()
    status_data = [{"name": s.value, "value": count} for s, count in status_counts]
    
    # Category distribution
    category_counts = db.query(Complaint.category, func.count(Complaint.id))\
        .group_by(Complaint.category).all()
    category_data = [{"name": c or "General", "value": count} for c, count in category_counts]
    
    # Simulated trend data (in a real app, group by month/date)
    trend_data = [
        {"name": "Jan", "complaints": 4},
        {"name": "Feb", "complaints": 7},
        {"name": "Mar", "complaints": 5},
        {"name": "Apr", "complaints": 12},
        {"name": "May", "complaints": total},
    ]
    
    return {
        "total": total,
        "status_distribution": status_data,
        "category_distribution": category_data,
        "trend_data": trend_data
    }

@router.put("/{complaint_id}/status", response_model=ComplaintRead)
def update_complaint_status(
    *,
    db: Session = Depends(get_db),
    complaint_id: int,
    complaint_in: ComplaintUpdate,
    current_user: User = Depends(get_current_hod_or_admin),
) -> Any:
    """
    Update a complaint's status (HOD/Admin only) and notify student.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    old_status = complaint.status
    old_is_escalated = complaint.is_escalated

    if complaint_in.status is not None:
        complaint.status = complaint_in.status
    if complaint_in.is_escalated is not None:
        complaint.is_escalated = complaint_in.is_escalated
    if complaint_in.hod_remarks is not None:
        complaint.hod_remarks = complaint_in.hod_remarks
    if complaint_in.escalation_status is not None:
        complaint.escalation_status = complaint_in.escalation_status
    if complaint_in.admin_remarks is not None:
        complaint.admin_remarks = complaint_in.admin_remarks

    db.add(complaint)

    new_status_value = complaint_in.status.value if complaint_in.status else None

    # Notify on status change (except resolved — handled separately below)
    if new_status_value and old_status.value != new_status_value and new_status_value != 'resolved':
        notification = Notification(
            user_id=complaint.student_id,
            title="Complaint Status Updated",
            message=f"Your complaint '{complaint.title}' status is now: {new_status_value.replace('_', ' ').title()}."
        )
        db.add(notification)

    # Notify on escalation (only the first time — when it was not escalated before)
    if complaint_in.is_escalated and not old_is_escalated:
        notification = Notification(
            user_id=complaint.student_id,
            title="Complaint Escalated",
            message=f"Your complaint '{complaint.title}' has been escalated to the System Administrator for further review."
        )
        db.add(notification)
        notification = Notification(
            user_id=complaint.student_id,
            title="Complaint Escalated",
            message=f"Your complaint '{complaint.title}' has been escalated to the System Administrator for further review."
        )
        db.add(notification)

    # Notify student when admin clears the escalation
    if complaint_in.escalation_status == 'cleared':
        notification = Notification(
            user_id=complaint.student_id,
            title="Admin Has Cleared Your Escalation",
            message=f"Your escalated complaint '{complaint.title}' has been cleared by Admin. The HOD will now finalise the resolution."
        )
        db.add(notification)

    # Notify student when HOD resolves
    if new_status_value == 'resolved' and old_status.value != 'resolved':
        notification = Notification(
            user_id=complaint.student_id,
            title="Complaint Resolved",
            message=f"Your complaint '{complaint.title}' has been marked as Resolved by the department."
        )
        db.add(notification)

    db.commit()
    db.refresh(complaint)
    return complaint

from fastapi import UploadFile, File
from app.models.complaint import ComplaintAttachment
from app.services.cloudinary import upload_image
from app.schemas.complaint_attachment import ComplaintAttachmentRead

@router.post("/{complaint_id}/upload-attachment", response_model=ComplaintAttachmentRead)
async def upload_complaint_attachment(
    *,
    db: Session = Depends(get_db),
    complaint_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Upload an image attachment for a complaint.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    if current_user.role == UserRole.student and complaint.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    # Upload to Cloudinary (Mock)
    file_url = await upload_image(file)
    
    attachment = ComplaintAttachment(
        complaint_id=complaint.id,
        file_url=file_url,
        file_type=file.content_type
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    
    return attachment

@router.get("/{complaint_id}/analysis", response_model=AIAnalysisRead)
def get_complaint_analysis(
    *,
    db: Session = Depends(get_db),
    complaint_id: int,
    current_user: User = Depends(get_current_hod_or_admin),
) -> Any:
    """
    Get AI analysis for a complaint (HOD/Admin only).
    """
    analysis = db.query(AIAnalysis).filter(AIAnalysis.reference_id == complaint_id, AIAnalysis.type == "complaint").first()
    if not analysis:
        raise HTTPException(status_code=404, detail="AI Analysis not found or not yet processed.")
    return analysis
