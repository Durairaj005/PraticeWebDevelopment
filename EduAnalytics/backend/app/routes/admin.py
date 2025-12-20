"""
Admin routes - Manage students, marks, CSV upload, etc.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Header
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Student, Mark, Admin, Batch, Semester, Subject, CSVUploadLog
from app.core.security import decode_token
from app.schemas.schemas import StudentCreate, StudentResponse, MarkCreate, MarkResponse, MarkUpdate
from app.core.security import get_password_hash
from typing import Optional, List
import csv
import io
from datetime import datetime

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])

@router.get("/test")
async def test_endpoint():
    """Test endpoint - no authentication required"""
    return {"status": "ok", "message": "Admin routes working"}

def validate_dob_format(dob: str) -> bool:
    """Validate date of birth format DD-MM-YYYY"""
    try:
        datetime.strptime(dob.strip(), "%d-%m-%Y")
        return True
    except ValueError:
        return False

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
        raise HTTPException(status_code=404, detail="Admin not found")
    
    return admin

@router.post("/students", response_model=StudentResponse)
async def create_student(
    student_data: StudentCreate,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create a new student"""
    # Check if register number already exists
    existing = db.query(Student).filter(Student.register_no == student_data.register_no).first()
    if existing:
        raise HTTPException(status_code=400, detail="Register number already exists")
    
    # Hash password
    password_hash = get_password_hash(student_data.password)
    
    student = Student(
        register_no=student_data.register_no,
        name=student_data.name,
        email=student_data.email,
        password_hash=password_hash,
        batch_id=student_data.batch_id
    )
    
    db.add(student)
    db.commit()
    db.refresh(student)
    
    return student

@router.get("/students")
async def list_students(
    batch_id: Optional[int] = None,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all students or filter by batch"""
    query = db.query(Student)
    
    if batch_id:
        query = query.filter(Student.batch_id == batch_id)
    
    students = query.all()
    
    return {
        "total": len(students),
        "students": [
            {
                "id": s.id,
                "register_no": s.register_no,
                "name": s.name,
                "email": s.email,
                "batch_id": s.batch_id,
                "is_active": s.is_active
            }
            for s in students
        ]
    }

@router.post("/marks", response_model=MarkResponse)
async def create_mark(
    mark_data: MarkCreate,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create or update a mark for a student"""
    # Check if mark already exists
    existing = db.query(Mark).filter(
        Mark.student_id == mark_data.student_id,
        Mark.subject_id == mark_data.subject_id,
        Mark.semester_id == mark_data.semester_id
    ).first()
    
    if existing:
        # Update existing mark
        existing.ca1 = mark_data.ca1
        existing.ca2 = mark_data.ca2
        existing.ca3 = mark_data.ca3
        existing.semester = mark_data.semester
        db.commit()
        db.refresh(existing)
        return existing
    
    # Create new mark
    mark = Mark(
        student_id=mark_data.student_id,
        subject_id=mark_data.subject_id,
        semester_id=mark_data.semester_id,
        ca1=mark_data.ca1,
        ca2=mark_data.ca2,
        ca3=mark_data.ca3,
        semester=mark_data.semester
    )
    
    db.add(mark)
    db.commit()
    db.refresh(mark)
    
    return mark

@router.get("/marks/student/{student_id}")
async def get_student_marks(
    student_id: int,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all marks for a specific student"""
    marks = db.query(Mark).filter(Mark.student_id == student_id).all()
    
    return {
        "student_id": student_id,
        "marks": [
            {
                "id": m.id,
                "subject_name": m.subject.name if m.subject else "Unknown",
                "ca1": m.ca1,
                "ca2": m.ca2,
                "ca3": m.ca3,
                "ca_average": m.ca_average,
                "semester": m.semester,
                "passed": m.is_passed
            }
            for m in marks
        ]
    }

@router.post("/csv-upload")
async def upload_csv(
    file: UploadFile = File(...),
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Upload CSV file with student data and marks
    
    Expected CSV format:
    Register_No,Student_Name,Email,Batch_Year,Semester,Subject_Name,CA1,CA2,CA3,Semester_Marks,Date_of_Birth[,SEM_Grade]
    
    - CA1, CA2, CA3: REQUIRED (Continuous Assessment marks out of 60)
    - Semester_Marks: OPTIONAL (Raw marks 0-100)
    - SEM_Grade: OPTIONAL (O, A+, A, B+, B, C, RA - added when semester results published)
    - Date_of_Birth format: DD-MM-YYYY (e.g., 15-03-2005)
    
    CA Pass Requirement: Average of CA marks >= 30 out of 60
    """
    logger = __import__('logging').getLogger(__name__)
    logger.info(f"📤 CSV UPLOAD STARTED: {file.filename} by admin {admin.id}")
    try:
        contents = await file.read()
        csv_reader = csv.DictReader(io.StringIO(contents.decode('utf-8')))
        
        success_count = 0
        error_messages = []
        upload_log_id = None
        
        for row_num, row in enumerate(csv_reader, start=2):
            try:
                # Parse and validate required fields
                register_no = row.get('Register_No', '').strip()
                student_name = row.get('Student_Name', '').strip()
                email = row.get('Email', '').strip()
                dob = row.get('Date_of_Birth', '').strip()
                batch_year = row.get('Batch_Year', '').strip()
                semester_num = row.get('Semester', '1').strip()
                subject_name = row.get('Subject_Name', '').strip()
                
                if not all([register_no, student_name, email, dob, batch_year, subject_name]):
                    error_messages.append(f"Row {row_num}: Missing required fields")
                    continue
                
                # Validate DOB format (DD-MM-YYYY)
                if not validate_dob_format(dob):
                    error_messages.append(f"Row {row_num}: Invalid date format. Use DD-MM-YYYY (e.g., 15-03-2005)")
                    continue
                
                # Find or create batch
                batch = db.query(Batch).filter(Batch.batch_year == batch_year).first()
                if not batch:
                    batch = Batch(batch_year=batch_year)
                    db.add(batch)
                    db.flush()
                
                # Find or create student with DOB instead of password
                student = db.query(Student).filter(
                    Student.register_no == register_no
                ).first()
                
                if not student:
                    # Create new student (NO password hash - use DOB directly for login)
                    student = Student(
                        register_no=register_no,
                        name=student_name,
                        email=email,
                        date_of_birth=dob,
                        batch_id=batch.id
                    )
                    db.add(student)
                    db.flush()
                else:
                    # Update existing student's DOB and batch
                    student.date_of_birth = dob
                    student.batch_id = batch.id
                
                # Find or create subject
                subject = db.query(Subject).filter(
                    Subject.name == subject_name
                ).first()
                
                if not subject:
                    subject = Subject(name=subject_name, code=subject_name[:10].upper())
                    db.add(subject)
                    db.flush()
                
                # Find or create semester
                semester = db.query(Semester).filter(
                    Semester.batch_id == batch.id,
                    Semester.semester_number == int(semester_num)
                ).first()
                
                if not semester:
                    semester = Semester(
                        batch_id=batch.id,
                        semester_number=int(semester_num),
                        academic_year=f"{batch_year}-{int(batch_year)+1}"
                    )
                    db.add(semester)
                    db.flush()
                
                # Create or update mark
                mark = db.query(Mark).filter(
                    Mark.student_id == student.id,
                    Mark.subject_id == subject.id,
                    Mark.semester_id == semester.id
                ).first()
                
                if not mark:
                    mark = Mark(
                        student_id=student.id,
                        subject_id=subject.id,
                        semester_id=semester.id
                    )
                    db.add(mark)
                
                # Parse CA marks (REQUIRED)
                try:
                    mark.ca1 = float(row.get('CA1', 0)) if row.get('CA1') else None
                    mark.ca2 = float(row.get('CA2', 0)) if row.get('CA2') else None
                    mark.ca3 = float(row.get('CA3', 0)) if row.get('CA3') else None
                except ValueError as e:
                    error_messages.append(f"Row {row_num}: Invalid CA marks format - {str(e)}")
                    continue
                
                # Parse Semester marks (OPTIONAL - for initial data only, grades entered later)
                try:
                    sem_marks_str = row.get('Semester_Marks', '').strip()
                    mark.semester_marks = float(sem_marks_str) if sem_marks_str else None
                except ValueError:
                    mark.semester_marks = None
                
                # Parse SEM Grade (OPTIONAL - only when results published)
                sem_grade = row.get('SEM_Grade', '').strip().upper() if row.get('SEM_Grade') else None
                if sem_grade and sem_grade != '':
                    valid_grades = ['O', 'A+', 'A', 'B+', 'B', 'C', 'RA']
                    if sem_grade not in valid_grades:
                        error_messages.append(f"Row {row_num}: Invalid SEM_Grade '{sem_grade}'. Must be one of: {', '.join(valid_grades)}")
                        continue
                    mark.sem_grade = sem_grade
                
                # FIX: Set sem_published to True if semester marks exist (regardless of SEM_Grade)
                mark.sem_published = mark.semester_marks is not None and mark.semester_marks > 0
                
                success_count += 1
                
            except Exception as e:
                print(f"[UPLOAD ERROR] Row {row_num}: {type(e).__name__}: {str(e)}")
                error_messages.append(f"Row {row_num}: {str(e)}")
        
        # CRITICAL FIX: Ensure all pending changes are flushed before commit
        db.flush()
        # COMMIT ONCE at the end of all rows
        db.commit()
        
        # Log upload
        upload_log = CSVUploadLog(
            admin_id=admin.id,
            filename=file.filename,
            uploaded_records=success_count,
            success=len(error_messages) == 0,
            error_message="; ".join(error_messages) if error_messages else None
        )
        db.add(upload_log)
        db.commit()
        upload_log_id = upload_log.id
        
        return {
            "filename": file.filename,
            "total_rows": success_count + len(error_messages),
            "success_count": success_count,
            "error_count": len(error_messages),
            "errors": error_messages,
            "upload_log_id": upload_log_id,
            "status": "success" if success_count > 0 else "failed"
        }
        
    except Exception as e:
        db.rollback()
        return {
            "filename": file.filename,
            "error": str(e),
            "status": "failed"
        }

@router.get("/upload-history")
async def get_upload_history(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get CSV upload history"""
    logs = db.query(CSVUploadLog).filter(CSVUploadLog.admin_id == admin.id).order_by(CSVUploadLog.created_at.desc()).limit(10).all()
    
    return {
        "uploads": [
            {
                "id": log.id,
                "filename": log.filename,
                "uploaded_records": log.uploaded_records,
                "success": log.success,
                "error_message": log.error_message,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            for log in logs
        ]
    }

@router.delete("/delete-last-upload")
async def delete_last_upload(
    batch_year: Optional[str] = None,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Delete the last uploaded batch data (students and marks from most recent upload)
    Returns the count of deleted records
    
    Query Parameters:
        batch_year (optional): Filter by specific batch year (e.g., "2025" or "2023")
                             If not provided, deletes from the latest upload regardless of batch
    """
    try:
        # If batch_year is provided, delete all students from that batch
        if batch_year:
            # Find the batch
            batch = db.query(Batch).filter(Batch.batch_year == batch_year).first()
            if not batch:
                return {
                    "status": "error",
                    "message": f"Batch {batch_year} not found",
                    "deleted_students": 0,
                    "deleted_marks": 0
                }
            
            # Get all students in this batch
            students_to_delete = db.query(Student).filter(Student.batch_id == batch.id).all()
        else:
            # Get the most recent upload for this admin
            latest_upload = db.query(CSVUploadLog).filter(
                CSVUploadLog.admin_id == admin.id
            ).order_by(CSVUploadLog.created_at.desc()).first()
            
            if not latest_upload:
                return {
                    "status": "error",
                    "message": "No upload found to delete",
                    "deleted_students": 0,
                    "deleted_marks": 0
                }
            
            upload_time = latest_upload.created_at
            filename = latest_upload.filename
            
            # Find all students created after this upload time
            students_to_delete = db.query(Student).filter(
                Student.created_at >= upload_time
            ).all()
        
        deleted_marks = 0
        deleted_students = 0
        
        # Delete marks for these students first (foreign key constraint)
        for student in students_to_delete:
            marks = db.query(Mark).filter(Mark.student_id == student.id).all()
            for mark in marks:
                db.delete(mark)
                deleted_marks += 1
            
            # Delete the student
            db.delete(student)
            deleted_students += 1
        
        # Delete upload logs for this batch if batch_year was provided
        if batch_year and deleted_students > 0:
            db.query(CSVUploadLog).filter(
                CSVUploadLog.admin_id == admin.id,
                CSVUploadLog.filename.contains(batch_year) | CSVUploadLog.filename.contains('students')
            ).delete()
        elif not batch_year and deleted_students > 0:
            # Delete only the latest upload log if no batch_year specified
            latest_upload = db.query(CSVUploadLog).filter(
                CSVUploadLog.admin_id == admin.id
            ).order_by(CSVUploadLog.created_at.desc()).first()
            if latest_upload:
                db.delete(latest_upload)
        
        db.commit()
        
        return {
            "status": "success",
            "message": f"Deleted batch data",
            "deleted_students": deleted_students,
            "deleted_marks": deleted_marks
        }
        
    except Exception as e:
        db.rollback()
        return {
            "status": "error",
            "message": f"Error deleting upload: {str(e)}",
            "deleted_students": 0,
            "deleted_marks": 0
        }

# ==========================================
# MARKS EDIT ENDPOINTS (Dashboard Edit Feature)
# ==========================================

@router.get("/students/{student_id}/marks")
async def get_student_marks_for_edit(
    student_id: int,
    db: Session = Depends(get_db)
):
    """Get all marks for a student (for editing dashboard)"""
    try:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        marks = db.query(Mark).filter(Mark.student_id == student_id).all()
        
        return {
            "student_id": student.id,
            "register_no": student.register_no,
            "name": student.name,
            "email": student.email,
            "batch_year": student.batch.batch_year if student.batch else None,
            "marks": [
                {
                    "mark_id": m.id,
                    "subject_id": m.subject_id,
                    "subject_name": m.subject.name if m.subject else "Unknown",
                    "semester": m.semester.semester_number if m.semester else 1,
                    "ca1": float(m.ca1) if m.ca1 else None,
                    "ca2": float(m.ca2) if m.ca2 else None,
                    "ca3": float(m.ca3) if m.ca3 else None,
                    "semester_marks": float(m.semester_marks) if m.semester_marks else None,
                    "sem_grade": m.sem_grade if hasattr(m, 'sem_grade') else None
                }
                for m in marks
            ]
        }
    except Exception as e:
        import traceback
        print(f"Error in get_student_marks_for_edit: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching marks: {str(e)}")

@router.put("/marks/{mark_id}")
async def update_mark(
    mark_id: int,
    mark_data: MarkUpdate,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update individual mark (Dashboard edit feature)
    
    Request body:
    {
      "ca1": 54,
      "ca2": 48,
      "ca3": null,
      "semester": 78
    }
    """
    mark = db.query(Mark).filter(Mark.id == mark_id).first()
    if not mark:
        raise HTTPException(status_code=404, detail="Mark not found")
    
    # Update fields if provided (validation already done by Pydantic schema)
    if mark_data.ca1 is not None:
        mark.ca1 = mark_data.ca1
    if mark_data.ca2 is not None:
        mark.ca2 = mark_data.ca2
    if mark_data.ca3 is not None:
        mark.ca3 = mark_data.ca3
    if mark_data.semester is not None:
        mark.semester_marks = mark_data.semester
    
    # FIX: Set sem_published flag when semester marks exist
    mark.sem_published = mark.semester_marks is not None and mark.semester_marks > 0
    
    try:
        db.commit()
        db.refresh(mark)
        return {
            "message": "Mark updated successfully",
            "mark_id": mark.id,
            "ca1": mark.ca1,
            "ca2": mark.ca2,
            "ca3": mark.ca3,
            "semester_marks": mark.semester_marks
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating mark: {str(e)}")

@router.get("/all-students")
async def get_all_students(
    batch_year: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all students (with optional batch filter) - for edit dashboard"""
    query = db.query(Student)
    
    if batch_year:
        query = query.join(Batch).filter(Batch.batch_year == batch_year)
    
    students = query.order_by(Student.register_no).all()
    
    return {
        "total": len(students),
        "students": [
            {
                "student_id": s.id,
                "register_no": s.register_no,
                "name": s.name,
                "email": s.email,
                "batch_year": s.batch.batch_year if s.batch else None,
                "total_subjects": len(s.marks) if s.marks else 0
            }
            for s in students
        ]
    }

@router.get("/batches")
async def get_all_batches(
    db: Session = Depends(get_db)
):
    """Get all batches for filtering"""
    batches = db.query(Batch).order_by(Batch.batch_year.desc()).all()
    
    return {
        "batches": [
            {
                "id": b.id,
                "batch_year": b.batch_year,
                "total_students": len(b.students) if b.students else 0
            }
            for b in batches
        ]
    }

@router.delete("/marks/{mark_id}")
async def delete_mark(
    mark_id: int,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete a specific mark - Used for batch-wide subject deletion"""
    mark = db.query(Mark).filter(Mark.id == mark_id).first()
    if not mark:
        raise HTTPException(status_code=404, detail="Mark not found")
    
    try:
        db.delete(mark)
        db.commit()
        return {
            "message": "Mark deleted successfully",
            "mark_id": mark_id,
            "student_id": mark.student_id,
            "subject_id": mark.subject_id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting mark: {str(e)}")
