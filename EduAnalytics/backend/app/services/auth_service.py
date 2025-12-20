"""
Authentication service
"""
from sqlalchemy.orm import Session
from app.db.models import Student, Admin
from app.core.security import verify_password, get_password_hash, create_access_token
from datetime import timedelta
from typing import Optional
import os

# Firebase Admin SDK (optional - only if you have credentials)
try:
    import firebase_admin
    from firebase_admin import credentials, auth as firebase_auth
    
    # Initialize Firebase Admin SDK if credentials are available
    firebase_cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    if firebase_cred_path and os.path.exists(firebase_cred_path):
        cred = credentials.Certificate(firebase_cred_path)
        firebase_admin.initialize_app(cred)
        FIREBASE_ENABLED = True
    else:
        FIREBASE_ENABLED = False
except ImportError:
    FIREBASE_ENABLED = False
except Exception:
    FIREBASE_ENABLED = False

def authenticate_student(db: Session, register_no: str, dob: str):
    """Authenticate student with register number and date of birth
    
    Args:
        db: Database session
        register_no: Student register number (e.g., "CS2025001")
        dob: Date of birth in format "DD-MM-YYYY" (e.g., "12-01-2006")
    
    Returns:
        Student object if authentication successful, None otherwise
    """
    student = db.query(Student).filter(Student.register_no == register_no).first()
    
    if not student:
        print(f"[AUTH DEBUG] Student not found: {register_no}")
        return None
    
    # Simple direct string comparison - both should be DD-MM-YYYY
    student_dob = (student.date_of_birth or "").strip()
    dob_input = (dob or "").strip()
    
    print(f"[AUTH DEBUG] Comparing:")
    print(f"  Input DOB: '{dob_input}' (len={len(dob_input)})")
    print(f"  DB DOB:    '{student_dob}' (len={len(student_dob)})")
    
    if student_dob == dob_input:
        print(f"[AUTH DEBUG] ✓ Authentication successful for {register_no}")
        return student
    
    print(f"[AUTH DEBUG] ✗ DOB mismatch for {register_no}")
    return None

def create_student_token(student_id: int, register_no: str) -> str:
    """Create JWT token for student"""
    access_token_expires = timedelta(days=7)
    token = create_access_token(
        data={"sub": str(student_id), "register_no": register_no, "role": "student"},
        expires_delta=access_token_expires
    )
    return token

def create_admin_token(admin_id: int, email: str) -> str:
    """Create JWT token for admin"""
    access_token_expires = timedelta(days=7)
    token = create_access_token(
        data={"sub": str(admin_id), "email": email, "role": "admin"},
        expires_delta=access_token_expires
    )
    return token

def verify_google_token(id_token: str) -> Optional[dict]:
    """
    Verify Google Firebase ID token
    
    Returns user info if valid, None otherwise
    """
    if not FIREBASE_ENABLED:
        # For development: return mock data if Firebase is not configured
        # In production, you should raise an error here
        print("⚠️ Warning: Firebase is not configured. Using mock authentication.")
        return {
            "uid": "mock-uid-12345",
            "email": "test@example.com",
            "name": "Test User"
        }
    
    try:
        # Verify the Firebase ID token
        decoded_token = firebase_auth.verify_id_token(id_token)
        
        # Extract user information
        user_info = {
            "uid": decoded_token.get("uid"),
            "email": decoded_token.get("email"),
            "name": decoded_token.get("name", decoded_token.get("email", "").split("@")[0]),
            "picture": decoded_token.get("picture"),
            "email_verified": decoded_token.get("email_verified", False)
        }
        
        return user_info
    except Exception as e:
        print(f"Firebase token verification failed: {e}")
        return None
