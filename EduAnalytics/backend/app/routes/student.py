"""
Student routes - Dashboard, analytics, marks, etc.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Student, Mark, Batch
from app.core.security import decode_token
from app.schemas.schemas import StudentDetailResponse, StudentDashboardResponse, ClassPerformanceResponse
from typing import Optional

router = APIRouter(prefix="/api/v1/student", tags=["Student"])

def get_current_student(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Get current logged-in student from token"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = decode_token(token)
        if not payload or payload.get("role") != "student":
            raise HTTPException(status_code=401, detail="Invalid token")
        student_id = int(payload.get("sub"))
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return student

@router.get("/profile", response_model=StudentDetailResponse)
async def get_student_profile(student: Student = Depends(get_current_student)):
    """Get current student profile"""
    return student

@router.get("/dashboard", response_model=StudentDashboardResponse)
async def get_dashboard(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Get student dashboard with marks and performance"""
    # Get all marks for this student
    marks = db.query(Mark).filter(Mark.student_id == student.id).all()
    
    # Get batch year
    batch = db.query(Batch).filter(Batch.id == student.batch_id).first()
    batch_year = batch.batch_year if batch else "N/A"
    
    # Check if semester results are published (any mark has sem_published = True)
    sem_published = any(m.sem_published for m in marks) if marks else False
    
    if not marks:
        return {
            "student_id": student.id,
            "name": student.name,
            "register_no": student.register_no,
            "batch_year": batch_year,
            "total_subjects": 0,
            "subjects_passed": 0,
            "subjects_failed": 0,
            "overall_average": 0.0,
            "ca_averages": {"CA1": 0, "CA2": 0, "CA3": 0},
            "semester_average": 0.0,
            "rank": None,
            "sem_published": False
        }
    
    # Calculate statistics
    total_subjects = len(marks)
    subjects_passed = sum(1 for m in marks if m.is_passed)
    subjects_failed = total_subjects - subjects_passed
    
    # Calculate CA averages per component
    ca1_values = [m.ca1 for m in marks if m.ca1 is not None]
    ca2_values = [m.ca2 for m in marks if m.ca2 is not None]
    ca3_values = [m.ca3 for m in marks if m.ca3 is not None]
    
    ca1_avg = sum(ca1_values) / len(ca1_values) if ca1_values else 0.0
    ca2_avg = sum(ca2_values) / len(ca2_values) if ca2_values else 0.0
    ca3_avg = sum(ca3_values) / len(ca3_values) if ca3_values else 0.0
    
    # Overall CA average
    all_ca_values = ca1_values + ca2_values + ca3_values
    ca_overall = sum(all_ca_values) / len(all_ca_values) if all_ca_values else 0.0
    
    # Semester average
    sem_values = [m.semester_marks for m in marks if m.semester_marks is not None]
    sem_avg = sum(sem_values) / len(sem_values) if sem_values else 0.0
    
    # Overall average (50% CA + 50% Semester)
    overall_avg = (ca_overall * 0.5 + sem_avg * 0.5) if (ca_overall or sem_avg) else 0.0
    
    # Calculate rank (students with higher overall average rank higher)
    all_students = db.query(Student).filter(Student.batch_id == student.batch_id).all()
    rank = 1
    for other_student in all_students:
        if other_student.id == student.id:
            continue
        other_marks = db.query(Mark).filter(Mark.student_id == other_student.id).all()
        if other_marks:
            other_ca1 = [m.ca1 for m in other_marks if m.ca1 is not None]
            other_ca2 = [m.ca2 for m in other_marks if m.ca2 is not None]
            other_ca3 = [m.ca3 for m in other_marks if m.ca3 is not None]
            other_all_ca = other_ca1 + other_ca2 + other_ca3
            other_ca_overall = sum(other_all_ca) / len(other_all_ca) if other_all_ca else 0.0
            
            other_sem = [m.semester_marks for m in other_marks if m.semester_marks is not None]
            other_sem_avg = sum(other_sem) / len(other_sem) if other_sem else 0.0
            
            other_overall = (other_ca_overall * 0.5 + other_sem_avg * 0.5)
            if other_overall > overall_avg:
                rank += 1
    
    return {
        "student_id": student.id,
        "name": student.name,
        "register_no": student.register_no,
        "batch_year": batch_year,
        "total_subjects": total_subjects,
        "subjects_passed": subjects_passed,
        "subjects_failed": subjects_failed,
        "overall_average": round(overall_avg, 2),
        "ca_averages": {
            "CA1": round(ca1_avg, 2),
            "CA2": round(ca2_avg, 2),
            "CA3": round(ca3_avg, 2)
        },
        "semester_average": round(sem_avg, 2),
        "rank": rank,
        "sem_published": sem_published
    }

@router.get("/marks")
async def get_all_marks(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Get all marks for current student"""
    marks = db.query(Mark).filter(Mark.student_id == student.id).all()
    
    return {
        "student_id": student.id,
        "marks": [
            {
                "subject_name": m.subject.name if m.subject else "Unknown",
                "ca1": m.ca1,
                "ca2": m.ca2,
                "ca3": m.ca3,
                "ca_average": m.ca_average,
                "semester_marks": m.semester_marks,
                "passed": m.is_passed
            }
            for m in marks
        ]
    }

@router.get("/class-performance")
async def get_class_performance(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Get student's performance compared to class"""
    # Get all marks for this student
    my_marks = db.query(Mark).filter(Mark.student_id == student.id).all()
    
    if not my_marks:
        return {
            "student_id": student.id,
            "my_average": 0.0,
            "class_average": 0.0,
            "percentile": 0.0
        }
    
    my_ca_avg = sum([m.ca_average for m in my_marks if m.ca_average]) / len([m for m in my_marks if m.ca_average]) if any(m.ca_average for m in my_marks) else 0
    
    # Get all students' averages in same batch
    batch_students = db.query(Student).filter(Student.batch_id == student.batch_id).all()
    all_averages = []
    
    for bs in batch_students:
        bs_marks = db.query(Mark).filter(Mark.student_id == bs.id).all()
        if bs_marks:
            bs_avg = sum([m.ca_average for m in bs_marks if m.ca_average]) / len([m for m in bs_marks if m.ca_average]) if any(m.ca_average for m in bs_marks) else 0
            all_averages.append(bs_avg)
    
    class_avg = sum(all_averages) / len(all_averages) if all_averages else 0
    percentile = (sum(1 for a in all_averages if a <= my_ca_avg) / len(all_averages) * 100) if all_averages else 0
    
    return {
        "student_id": student.id,
        "my_average": my_ca_avg,
        "class_average": class_avg,
        "percentile": percentile
    }
