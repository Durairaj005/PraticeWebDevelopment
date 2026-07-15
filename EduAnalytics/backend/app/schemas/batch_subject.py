"""
Pydantic schemas for Batch-Semester Subject Management
"""

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class SubjectResponse(BaseModel):
    """Subject response model"""
    id: int
    name: str
    code: str
    
    class Config:
        from_attributes = True


class SubjectEditRequest(BaseModel):
    """Request to edit subject"""
    name: Optional[str] = None
    code: Optional[str] = None


class SubjectWithBatchInfo(BaseModel):
    """Subject with batch subject ID for mapping"""
    id: int
    name: str
    code: str
    batch_subject_id: Optional[int] = None


class SemesterInfo(BaseModel):
    """Semester information"""
    id: int
    semester_number: int
    academic_year: str
    subjects: List[SubjectWithBatchInfo]


class BatchSubjectCreate(BaseModel):
    """Create batch-subject mapping"""
    batch_id: int
    subject_id: int


class BatchSubjectResponse(BaseModel):
    """Batch-Subject mapping response"""
    id: int
    batch_id: int
    subject_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class BatchWithSemestersResponse(BaseModel):
    """Batch with all its semesters and subjects"""
    id: int
    batch_year: str
    semesters: List[SemesterInfo]
    created_at: datetime
    updated_at: datetime
