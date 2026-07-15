import time
import logging
from fastapi import UploadFile

logger = logging.getLogger(__name__)

# Note: In a production environment with valid API keys, we would import cloudinary here.
import cloudinary
import cloudinary.uploader
from app.core.config import settings

# Cloudinary configuration will automatically look for the CLOUDINARY_URL environment variable
# if we don't explicitly pass api_key, api_secret, etc.
if hasattr(settings, 'CLOUDINARY_URL') and settings.CLOUDINARY_URL:
    cloudinary.config(url=settings.CLOUDINARY_URL)

async def upload_image(file: UploadFile) -> str:
    """
    Uploads an image to Cloudinary if configured.
    Falls back to a placeholder if CLOUDINARY_URL is missing.
    """
    logger.info(f"Uploading file to Cloudinary: {file.filename}")
    
    # Check if Cloudinary is configured via the environment variable
    if not (hasattr(settings, 'CLOUDINARY_URL') and settings.CLOUDINARY_URL):
        logger.warning("CLOUDINARY_URL is missing! Returning a mocked placeholder image.")
        time.sleep(1.5)
        return f"https://picsum.photos/seed/{file.filename}/800/600"
        
    try:
        # Read the file bytes
        contents = await file.read()
        
        # Upload the image to Cloudinary
        result = cloudinary.uploader.upload(contents, folder="insightos_complaints")
        
        # Return the secure URL provided by Cloudinary
        return result.get("secure_url")
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {str(e)}")
        raise e
    finally:
        # Reset file pointer for any further reading (if necessary)
        await file.seek(0)
