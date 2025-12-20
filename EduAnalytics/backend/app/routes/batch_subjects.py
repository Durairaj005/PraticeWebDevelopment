"""
Batch-Semester Subject Management Routes
- Get all batches with semesters and their subjects
- Get batch-semester subjects
- Add subject to batch-semester
- Remove subject from batch-semester
- Edit/Rename subject
- Get all available subjects
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.models import Batch, Semester, Subject, BatchSubject, Admin
from app.db.database import get_db
from app.core.security import decode_token
from app.schemas.batch_subject import (
    BatchSubjectCreate,
    BatchSubjectResponse,
    BatchWithSemestersResponse,
    SubjectResponse,
    SubjectEditRequest
)

def get_current_admin(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Get current logged-in admin from token"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = decode_token(token)
        if not payload or payload.get("role") != "admin":
            raise HTTPException(status_code=401, detail="Invalid token")
        admin_id = int(payload.get("sub"))
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    return admin

router = APIRouter(prefix="/api/v1/admin/batch-subjects", tags=["Admin - Batch Subjects"])


@router.get("/batches", response_model=List[BatchWithSemestersResponse])
def get_all_batches_with_semesters(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Get all batches with their semesters and subjects"""
    batches = db.query(Batch).all()
    
    result = []
    for batch in batches:
        semesters_data = []
        for sem in batch.semesters:
            subjects = [
                {
                    "id": bs.subject.id,
                    "name": bs.subject.name,
                    "code": bs.subject.code,
                    "batch_subject_id": bs.id
                }
                for bs in db.query(BatchSubject).filter(
                    BatchSubject.batch_id == batch.id,
                    BatchSubject.semester_id == sem.id
                ).all()
            ]
            semesters_data.append({
                "id": sem.id,
                "semester_number": sem.semester_number,
                "academic_year": sem.academic_year,
                "subjects": subjects
            })
        
        batch_data = {
            "id": batch.id,
            "batch_year": batch.batch_year,
            "semesters": semesters_data,
            "created_at": batch.created_at,
            "updated_at": batch.updated_at
        }
        result.append(batch_data)
    
    return result


@router.get("/batch/{batch_id}/semester/{semester_id}")
def get_batch_semester_subjects(
    batch_id: int,
    semester_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Get specific batch-semester with all its subjects"""
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")
    
    semester = db.query(Semester).filter(
        Semester.id == semester_id,
        Semester.batch_id == batch_id
    ).first()
    if not semester:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Semester not found in this batch")
    
    subjects = [
        {
            "id": bs.subject.id,
            "name": bs.subject.name,
            "code": bs.subject.code,
            "batch_subject_id": bs.id
        }
        for bs in db.query(BatchSubject).filter(
            BatchSubject.batch_id == batch_id,
            BatchSubject.semester_id == semester_id
        ).all()
    ]
    
    return {
        "batch_id": batch.id,
        "batch_year": batch.batch_year,
        "semester_id": semester.id,
        "semester_number": semester.semester_number,
        "academic_year": semester.academic_year,
        "subjects": subjects,
        "subject_count": len(subjects)
    }


@router.get("/subjects/available", response_model=List[SubjectResponse])
def get_all_subjects(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Get all available subjects in the system"""
    subjects = db.query(Subject).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "code": s.code
        }
        for s in subjects
    ]


@router.post("/add-subject", response_model=dict)
def add_subject_to_batch_semester(
    batch_id: int = Query(...),
    semester_id: int = Query(None),
    subject_id: int = Query(...),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Add a subject to a batch (and all its semesters if no specific semester given)"""
    # Verify batch exists
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")
    
    # Verify subject exists
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    
    added_count = 0
    
    # If specific semester provided
    if semester_id:
        # Verify semester exists in batch
        semester = db.query(Semester).filter(
            Semester.id == semester_id,
            Semester.batch_id == batch_id
        ).first()
        if not semester:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Semester not found in this batch")
        
        # Check if already exists
        existing = db.query(BatchSubject).filter(
            BatchSubject.batch_id == batch_id,
            BatchSubject.semester_id == semester_id,
            BatchSubject.subject_id == subject_id
        ).first()
        
        if not existing:
            new_batch_subject = BatchSubject(
                batch_id=batch_id,
                semester_id=semester_id,
                subject_id=subject_id
            )
            db.add(new_batch_subject)
            added_count = 1
    else:
        # Add to ALL semesters in batch
        semesters = db.query(Semester).filter(Semester.batch_id == batch_id).all()
        
        if not semesters:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No semesters found in this batch")
        
        for sem in semesters:
            existing = db.query(BatchSubject).filter(
                BatchSubject.batch_id == batch_id,
                BatchSubject.semester_id == sem.id,
                BatchSubject.subject_id == subject_id
            ).first()
            
            if not existing:
                new_batch_subject = BatchSubject(
                    batch_id=batch_id,
                    semester_id=sem.id,
                    subject_id=subject_id
                )
                db.add(new_batch_subject)
                added_count += 1
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Subject '{subject.name}' added to Batch {batch.batch_year} ({added_count} semester(s))",
        "batch_subject_id": None,
        "semesters_added": added_count
    }


@router.delete("/remove-subject/{batch_subject_id}", response_model=dict)
def remove_subject_from_batch_semester(
    batch_subject_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Remove a subject from a batch-semester"""
    batch_subject = db.query(BatchSubject).filter(
        BatchSubject.id == batch_subject_id
    ).first()
    
    if not batch_subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch-Subject mapping not found")
    
    batch = batch_subject.batch
    semester = batch_subject.semester
    subject = batch_subject.subject
    
    db.delete(batch_subject)
    db.commit()
    
    return {
        "success": True,
        "message": f"Subject '{subject.name}' removed from Batch {batch.batch_year} Semester {semester.semester_number if semester else 'All'}"
    }


@router.post("/create-subject", response_model=SubjectResponse)
def create_new_subject(
    subject_name: str = Query(...),
    subject_code: str = Query(...),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Create a new subject in the system"""
    # Check if subject already exists
    existing = db.query(Subject).filter(
        (Subject.name == subject_name) | (Subject.code == subject_code)
    ).first()
    
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subject with this name or code already exists")
    
    new_subject = Subject(
        name=subject_name,
        code=subject_code
    )
    
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    
    return {
        "id": new_subject.id,
        "name": new_subject.name,
        "code": new_subject.code
    }


@router.put("/update-subject/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: int,
    request: SubjectEditRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Edit/Rename a subject"""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    
    # Check if new name/code already exists
    if request.name and request.name != subject.name:
        existing = db.query(Subject).filter(Subject.name == request.name).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subject name already exists")
    
    if request.code and request.code != subject.code:
        existing = db.query(Subject).filter(Subject.code == request.code).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subject code already exists")
    
    # Update fields
    if request.name:
        subject.name = request.name
    if request.code:
        subject.code = request.code
    
    db.commit()
    db.refresh(subject)
    
    return {
        "id": subject.id,
        "name": subject.name,
        "code": subject.code
    }

