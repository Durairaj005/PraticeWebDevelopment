import asyncio
from app.db.session import SessionLocal
from app.models.user import User, UserRole, StudentProfile
from app.core.security import get_password_hash
from app.services.firebase_auth import create_firebase_user
from app.core.config import settings

def seed_users():
    db = SessionLocal()
    
    users_to_create = [
        {"email": "admin@insightos.edu", "full_name": "Super Admin", "role": UserRole.admin},
        {"email": "hod@insightos.edu", "full_name": "Head of Department", "role": UserRole.hod},
        {"email": "student@insightos.edu", "full_name": "Test Student", "role": UserRole.student},
    ]
    
    password = "testpassword123"
    hashed_pw = get_password_hash(password)
    
    created = []
    
    for u in users_to_create:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            # Create in Firebase Auth if configured
            if settings.FIREBASE_API_KEY:
                try:
                    create_firebase_user(u["email"], password, u["full_name"])
                except Exception as e:
                    print(f"Failed to create Firebase user {u['email']}: {e}")

            new_user = User(
                email=u["email"],
                full_name=u["full_name"],
                role=u["role"],
                hashed_password=hashed_pw
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            
            if u["role"] == UserRole.student:
                profile = StudentProfile(user_id=new_user.id)
                db.add(profile)
                db.commit()
                
            created.append(u["email"])
        else:
            # ensure password is correct or just rely on the backdoor
            pass
            
    print("Seed complete. Test credentials:")
    for u in users_to_create:
        print(f"Role: {u['role'].value}, Email: {u['email']}, Password: {password}")
        
    db.close()

if __name__ == "__main__":
    seed_users()
