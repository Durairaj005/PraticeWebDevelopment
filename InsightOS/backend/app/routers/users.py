from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user, get_current_active_superuser
from app.core.security import get_password_hash
from app.models.user import User, UserRole, StudentProfile
from app.schemas.user import UserRead, UserCreate
from app.services.firebase_auth import create_firebase_user
from app.core.config import settings

router = APIRouter()

@router.post("/register", response_model=UserRead)
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """
    Register a new student user.
    """
    # 1. Domain Validation
    domain = user_in.email.split('@')[-1] if '@' in user_in.email else ''
    if domain != settings.ALLOWED_EMAIL_DOMAIN:
        raise HTTPException(
            status_code=400,
            detail=f"Please use your official college email (@{settings.ALLOWED_EMAIL_DOMAIN}) to register."
        )

    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
        
    # Create in Firebase Auth if configured
    if settings.FIREBASE_API_KEY:
        create_firebase_user(user_in.email, user_in.password, user_in.full_name)

    # By default, open registration creates a student. 
    # HOD and Admin creation should be protected in another endpoint under the admin router.
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=UserRole.student, 
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Initialize a student profile with provided data
    profile = StudentProfile(
        user_id=user.id,
        enrollment_number=user_in.enrollment_number,
        year=user_in.current_year,
        passout_year=user_in.passout_year
    )
    db.add(profile)
    db.commit()
    
    return user

@router.post("/setup-hod", response_model=UserRead)
def create_hod_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """
    [TEMPORARY DEV ENDPOINT] Register a new HOD user for testing.
    """
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
        
    # Create in Firebase Auth if configured
    if settings.FIREBASE_API_KEY:
        create_firebase_user(user_in.email, user_in.password, user_in.full_name)

    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=UserRole.hod, 
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user

@router.get("/me", response_model=UserRead)
def read_users_me(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.get("/", response_model=List[UserRead])
def read_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Get all users (Admin only).
    """
    users = db.query(User).all()
    return users

@router.post("/create-staff", response_model=UserRead)
def create_staff_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Create a new HOD or Admin user (Admin only).
    """
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
        
    # Create in Firebase Auth if configured
    if settings.FIREBASE_API_KEY:
        create_firebase_user(user_in.email, user_in.password, user_in.full_name)

    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role or UserRole.hod, 
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.delete("/{user_id}", response_model=UserRead)
def delete_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Delete or deactivate a user (Admin only).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
    db.delete(user)
    db.commit()
    return user

@router.post("/setup-admin", response_model=UserRead)
def create_admin_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """
    [TEMPORARY DEV ENDPOINT] Register a new Admin user for testing.
    """
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
        
    # Create in Firebase Auth if configured
    if settings.FIREBASE_API_KEY:
        create_firebase_user(user_in.email, user_in.password, user_in.full_name)

    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=UserRole.admin, 
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user
