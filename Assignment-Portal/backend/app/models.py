from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Literal["admin", "student"] = "student"

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "pending"
    priority: str = "medium"

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None

class TaskResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    created_at: datetime
    updated_at: datetime

# Assignment Models
class AssignmentCreate(BaseModel):
    title: str
    description: str
    due_date: datetime
    max_marks: int = 100

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    max_marks: Optional[int] = None

class AssignmentResponse(BaseModel):
    id: str
    title: str
    description: str
    due_date: datetime
    max_marks: int
    created_by: str
    created_at: datetime
    updated_at: datetime

# Submission Models
class SubmissionCreate(BaseModel):
    assignment_id: str
    submission_text: str
    file_url: Optional[str] = None

class SubmissionUpdate(BaseModel):
    submission_text: Optional[str] = None
    file_url: Optional[str] = None
    marks: Optional[int] = None
    feedback: Optional[str] = None
    status: Optional[Literal["pending", "graded"]] = None

class SubmissionResponse(BaseModel):
    id: str
    assignment_id: str
    student_id: str
    student_name: str
    submission_text: str
    file_url: Optional[str] = None
    status: str
    marks: Optional[int] = None
    feedback: Optional[str] = None
    submitted_at: datetime
    graded_at: Optional[datetime] = None
