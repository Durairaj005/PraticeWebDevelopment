"""
Authentication routes - Student and Admin login
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import StudentLogin, TokenResponse, GoogleAuthRequest
from app.services.auth_service import authenticate_student, create_student_token, create_admin_token, verify_google_token
from datetime import datetime

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

@router.post("/student/login", response_model=TokenResponse)
async def student_login(credentials: StudentLogin, db: Session = Depends(get_db)):
    """
    Student login with register number and date of birth
    
    Returns JWT token for authenticated student
    
    Request body:
        - register_no: Student register number (e.g., "CS2024001")
        - date_of_birth: Date of birth in DD-MM-YYYY format (e.g., "15-03-2005")
    """
    student = authenticate_student(db, credentials.register_no, credentials.date_of_birth)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid register number or date of birth"
        )
    
    if not student.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student account is inactive"
        )
    
    token = create_student_token(student.id, student.register_no)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": student.id,
        "email": student.email,
        "role": "student"
    }

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "auth"}

@router.post("/admin/google-login", response_model=TokenResponse)
async def admin_google_login(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Admin login with Google OAuth (Firebase)
    
    Returns JWT token for authenticated admin
    """
    # Verify Firebase ID token
    firebase_user = verify_google_token(request.id_token)
    if not firebase_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )
    
    # Get user info from Firebase
    email = firebase_user.get("email")
    firebase_uid = firebase_user.get("uid")
    name = firebase_user.get("name", email.split("@")[0])
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not found in Google account"
        )
    
    # Check if admin exists
    from app.db.models import Admin
    admin = db.query(Admin).filter(Admin.email == email).first()
    
    if not admin:
        # Create new admin with Google account
        admin = Admin(
            email=email,
            name=name,
            role="teacher",  # Default role, can be changed later
            firebase_uid=firebase_uid,
            is_active=True,
            last_login=datetime.utcnow()
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
    else:
        # Update existing admin
        if not admin.firebase_uid:
            admin.firebase_uid = firebase_uid
        admin.last_login = datetime.utcnow()
        db.commit()
    
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is inactive"
        )
    
    # Create JWT token
    token = create_admin_token(admin.id, admin.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": admin.id,
        "email": admin.email,
        "role": admin.role
    }
