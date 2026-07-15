"""
Comparison routes - Compare students and batches
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Student, Mark, Admin
from app.core.security import decode_token
from typing import Optional

router = APIRouter(prefix="/api/v1/compare", tags=["Comparisons"])

def get_current_user(authorization: Optional[str] = None, db: Session = Depends(get_db)):
    """Get current logged-in user from token"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = decode_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid token")
        return payload
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

@router.get("/students/{student1_id}/{student2_id}")
async def compare_students(
    student1_id: int,
    student2_id: int,
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compare two students' performance"""
    student1 = db.query(Student).filter(Student.id == student1_id).first()
    student2 = db.query(Student).filter(Student.id == student2_id).first()
    
    if not student1 or not student2:
        raise HTTPException(status_code=404, detail="One or both students not found")
    
    marks1 = db.query(Mark).filter(Mark.student_id == student1_id).all()
    marks2 = db.query(Mark).filter(Mark.student_id == student2_id).all()
    
    def calculate_stats(marks):
        if not marks:
            return {"avg_ca": 0, "avg_sem": 0, "passed": 0, "total": 0}
        
        ca_values = [m.ca_average for m in marks if m.ca_average]
        sem_values = [m.semester for m in marks if m.semester]
        
        return {
            "avg_ca": sum(ca_values) / len(ca_values) if ca_values else 0,
            "avg_sem": sum(sem_values) / len(sem_values) if sem_values else 0,
            "passed": sum(1 for m in marks if m.is_passed),
            "total": len(marks)
        }
    
    stats1 = calculate_stats(marks1)
    stats2 = calculate_stats(marks2)
    
    return {
        "student1": {
            "id": student1.id,
            "name": student1.name,
            "register_no": student1.register_no,
            **stats1
        },
        "student2": {
            "id": student2.id,
            "name": student2.name,
            "register_no": student2.register_no,
            **stats2
        },
        "comparison": {
            "ca_difference": stats1["avg_ca"] - stats2["avg_ca"],
            "sem_difference": stats1["avg_sem"] - stats2["avg_sem"],
            "passed_difference": stats1["passed"] - stats2["passed"],
            "winner": "student1" if stats1["avg_ca"] > stats2["avg_ca"] else "student2" if stats2["avg_ca"] > stats1["avg_ca"] else "tie"
        }
    }

@router.get("/batches/{batch1_id}/{batch2_id}")
async def compare_batches(
    batch1_id: int,
    batch2_id: int,
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compare two batches' overall performance"""
    from app.db.models import Batch
    
    batch1 = db.query(Batch).filter(Batch.id == batch1_id).first()
    batch2 = db.query(Batch).filter(Batch.id == batch2_id).first()
    
    if not batch1 or not batch2:
        raise HTTPException(status_code=404, detail="One or both batches not found")
    
    def get_batch_stats(batch_id):
        students = db.query(Student).filter(Student.batch_id == batch_id).all()
        all_marks = []
        
        for student in students:
            marks = db.query(Mark).filter(Mark.student_id == student.id).all()
            all_marks.extend(marks)
        
        if not all_marks:
            return {"avg_ca": 0, "avg_sem": 0, "passed": 0, "total": 0, "students": len(students)}
        
        # Calculate CA average: (CA1 + CA2 + CA3) / 3
        ca_values = []
        for m in all_marks:
            if m.ca1 and m.ca2 and m.ca3:
                ca_avg = (m.ca1 + m.ca2 + m.ca3) / 3
                ca_values.append(ca_avg)
        
        sem_values = [m.semester_marks for m in all_marks if m.semester_marks]
        passed = sum(1 for m in all_marks if m.semester_marks and m.semester_marks >= 40)  # 40 is typically pass mark
        
        return {
            "avg_ca": sum(ca_values) / len(ca_values) if ca_values else 0,
            "avg_sem": sum(sem_values) / len(sem_values) if sem_values else 0,
            "passed": passed,
            "total": len(all_marks),
            "students": len(students)
        }
    
    stats1 = get_batch_stats(batch1_id)
    stats2 = get_batch_stats(batch2_id)
    
    return {
        "batch1": {
            "id": batch1.id,
            "batch_year": batch1.batch_year,
            **stats1
        },
        "batch2": {
            "id": batch2.id,
            "batch_year": batch2.batch_year,
            **stats2
        },
        "comparison": {
            "ca_difference": stats1["avg_ca"] - stats2["avg_ca"],
            "sem_difference": stats1["avg_sem"] - stats2["avg_sem"],
            "passed_difference": stats1["passed"] - stats2["passed"],
            "better_batch": "batch1" if stats1["avg_ca"] > stats2["avg_ca"] else "batch2" if stats2["avg_ca"] > stats1["avg_ca"] else "equal"
        }
    }
