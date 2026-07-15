import json
import os
import requests
import logging
import firebase_admin
from firebase_admin import credentials, auth as fb_auth
from app.core.config import settings
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

# Initialize Firebase Admin
try:
    if settings.FIREBASE_CREDENTIALS_PATH and os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin initialized successfully.")
    else:
        logger.warning(f"Firebase credentials not found at {settings.FIREBASE_CREDENTIALS_PATH}. Firebase Admin not initialized.")
except Exception as e:
    logger.error(f"Error initializing Firebase Admin: {e}")

def create_firebase_user(email: str, password: str, display_name: str = None) -> str:
    """
    Create a user in Firebase Auth using the Admin SDK.
    Returns the Firebase uid.
    """
    if not firebase_admin._apps:
        # If Firebase is not initialized (e.g. local dev without keys), just simulate it
        logger.warning(f"Simulating Firebase user creation for {email}")
        return f"simulated_uid_{email}"
        
    try:
        user = fb_auth.create_user(
            email=email,
            password=password,
            display_name=display_name
        )
        return user.uid
    except Exception as e:
        logger.error(f"Failed to create Firebase user: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create user in authentication provider: {str(e)}"
        )

def verify_firebase_password(email: str, password: str) -> bool:
    """
    Verifies a user's password using the Firebase Identity Toolkit REST API.
    Returns True if valid, False otherwise.
    """
    if not settings.FIREBASE_API_KEY:
        logger.warning("No FIREBASE_API_KEY set. Falling back to local/mock verification.")
        # For development without a key, you could fallback to bcrypt or just return False.
        # We will return False to ensure secure defaults if not configured, unless it's the test backdoor.
        return False

    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={settings.FIREBASE_API_KEY}"
    payload = {
        "email": email,
        "password": password,
        "returnSecureToken": True
    }
    
    try:
        response = requests.post(url, json=payload)
        data = response.json()
        
        if response.status_code == 200 and "idToken" in data:
            return True
        else:
            logger.warning(f"Firebase authentication failed for {email}: {data}")
            return False
    except Exception as e:
        logger.error(f"Error communicating with Firebase REST API: {e}")
        return False
