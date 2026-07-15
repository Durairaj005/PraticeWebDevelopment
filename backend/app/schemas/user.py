from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = True

# Properties to receive via API on creation
class UserCreate(UserBase):
    email: EmailStr
    password: str
    full_name: str
    enrollment_number: Optional[str] = None
    current_year: Optional[int] = None
    passout_year: Optional[int] = None
    # role can be passed for initial admin creation, but we will default it to student in the router for open registrations
    
# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None
    profile_picture_url: Optional[str] = None

class UserInDBBase(UserBase):
    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    profile_picture_url: Optional[str] = None

    model_config = {"from_attributes": True}

# Additional properties to return via API
class UserRead(UserInDBBase):
    pass

# Additional properties stored in DB
class UserInDB(UserInDBBase):
    hashed_password: str
