from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.models import UserCreate, UserResponse, UserUpdate, Token
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user
from app.database import get_database
from datetime import datetime

router = APIRouter()

@router.post("/signup")
async def signup(user: UserCreate):
    db = get_database()
    
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "name": user.name,
        "email": user.email,
        "password": get_password_hash(user.password),
        "role": user.role,
        "bio": None,
        "avatar_url": None,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_doc)
    user_doc["id"] = str(result.inserted_id)
    
    token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_doc["id"],
            "name": user_doc["name"],
            "email": user_doc["email"],
            "role": user_doc["role"],
            "bio": user_doc["bio"],
            "avatar_url": user_doc["avatar_url"]
        }
    }

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = get_database()
    
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    user_update: UserUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    db = get_database()
    
    update_fields = {}
    if user_update.name is not None:
        update_fields["name"] = user_update.name
    if user_update.bio is not None:
        update_fields["bio"] = user_update.bio
    if user_update.avatar_url is not None:
        update_fields["avatar_url"] = user_update.avatar_url
    
    await db.users.update_one(
        {"email": current_user.email},
        {"$set": update_fields}
    )
    
    updated = await db.users.find_one({"email": current_user.email})
    updated["id"] = str(updated["_id"])
    
    return UserResponse(**updated)
