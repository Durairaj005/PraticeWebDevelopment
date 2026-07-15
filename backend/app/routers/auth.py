from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core import security
from app.core.config import settings
from app.models.user import User
from app.schemas.token import Token

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(
    db: Annotated[Session, Depends(get_db)],
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    from app.services.firebase_auth import verify_firebase_password
    
    # TEMPORARY: Allow login with "testpassword123" for any existing user (for local dev)
    is_password_valid = False
    if user:
        if form_data.password == "testpassword123":
            is_password_valid = True
        elif settings.FIREBASE_API_KEY:
            # Verify via Firebase if configured
            is_password_valid = verify_firebase_password(form_data.username, form_data.password)
        else:
            # Fallback to local bcrypt if no Firebase is configured
            is_password_valid = security.verify_password(form_data.password, user.hashed_password)

    if not user or not is_password_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    return Token(
        access_token=security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        token_type="bearer",
    )
