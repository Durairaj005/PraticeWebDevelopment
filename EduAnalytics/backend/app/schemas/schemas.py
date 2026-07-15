"""
Pydantic schemas for API request/response validation
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List


# ========================================
# BATCH SCHEMAS
# ========================================
class BatchCreate(BaseModel):
    batch_year: str = Field(..., min_length=4, max_length=4, description="e.g., 2024")


class BatchResponse(BaseModel):
    id: int
    batch_year: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ========================================
# SEMESTER SCHEMAS
# ========================================
class SemesterCreate(BaseModel):
    batch_id: int
    semester_number: int = Field(..., ge=1, le=8, description="1-8")
    academic_year: str = Field(..., description="e.g., 2024-2025")


class SemesterResponse(BaseModel):
    id: int
    batch_id: int
    semester_number: int
    academic_year: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ========================================
# SUBJECT SCHEMAS
# ========================================
class SubjectCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    code: str = Field(..., min_length=3, max_length=20)


class SubjectResponse(BaseModel):
    id: int
    name: str
    code: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ========================================
# STUDENT SCHEMAS
# ========================================
class StudentCreate(BaseModel):
    register_no: str = Field(..., min_length=5, max_length=20)
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    batch_id: int


class StudentLogin(BaseModel):
    register_no: str = Field(..., description="Student register number")
    date_of_birth: str = Field(..., description="Date of birth in DD-MM-YYYY format (e.g., 15-03-2005)")


class GoogleAuthRequest(BaseModel):
    id_token: str = Field(..., description="Firebase ID token from Google Sign-In")


class StudentResponse(BaseModel):
    id: int
    register_no: str
    name: str
    email: str
    batch_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StudentDetailResponse(StudentResponse):
    marks: List['MarkResponse'] = []


# ========================================
# MARK/SCORE SCHEMAS
# ========================================
class MarkCreate(BaseModel):
    student_id: int
    subject_id: int
    semester_id: int
    ca1: Optional[float] = Field(None, ge=0, le=100)
    ca2: Optional[float] = Field(None, ge=0, le=100)
    ca3: Optional[float] = Field(None, ge=0, le=100)
    semester: Optional[float] = Field(None, ge=0, le=100)


class MarkUpdate(BaseModel):
    ca1: Optional[float] = Field(None, ge=0, le=100)
    ca2: Optional[float] = Field(None, ge=0, le=100)
    ca3: Optional[float] = Field(None, ge=0, le=100)
    semester: Optional[float] = Field(None, ge=0, le=100)


class MarkResponse(BaseModel):
    id: int
    student_id: int
    subject_id: int
    semester_id: int
    ca1: Optional[float]
    ca2: Optional[float]
    ca3: Optional[float]
    semester: Optional[float]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @property
    def ca_average(self):
        """
        Calculate CA average based on number of exams conducted.
        Handles 2 or 3 CA exams:
        - 3 CAs: (CA1 + CA2 + CA3) / 3
        - 2 CAs: (CA1 + CA2) / 2
        Returns None if insufficient data
        """
        ca_scores = [self.ca1, self.ca2, self.ca3]
        non_null_scores = [score for score in ca_scores if score is not None]
        
        if len(non_null_scores) >= 2:  # At least 2 CAs required
            return sum(non_null_scores) / len(non_null_scores)
        return None

    @property
    def ca_total(self):
        """Calculate CA total (sum of all CA components for reference)"""
        ca_scores = [self.ca1, self.ca2, self.ca3]
        non_null_scores = [score for score in ca_scores if score is not None]
        return sum(non_null_scores) if non_null_scores else 0

    @property
    def ca_status(self):
        """CA Pass/Fail Status - based on average >= 30"""
        avg = self.ca_average
        if avg is None:
            return "Failed"
        return "Passed" if avg >= 30 else "Failed"

    @property
    def sem_grade(self):
        """
        Semester Grade based on marks:
        91-100 → O (Outstanding)
        81-90 → A+ (Excellent)
        71-80 → A (Very Good)
        61-70 → B+ (Good)
        56-60 → B (Average)
        50-55 → C (Satisfactory)
        <50 → RA (Re-Appear/Failed)
        """
        if self.semester is None or self.semester <= 0:
            return None
        
        marks = self.semester
        if marks >= 91:
            return "O"
        elif marks >= 81:
            return "A+"
        elif marks >= 71:
            return "A"
        elif marks >= 61:
            return "B+"
        elif marks >= 56:
            return "B"
        elif marks >= 50:
            return "C"
        else:
            return "RA"

    @property
    def sem_status(self):
        """Semester Status - only active when semester marks released"""
        if self.semester is None or self.semester <= 0:
            return "-"
        
        grade = self.sem_grade
        if grade == "RA":
            return f"{grade} (Failed)"
        return grade

    @property
    def is_passed(self):
        """
        Pass/Fail logic:
        - CA average >= 30 (mandatory - calculated from available CA exams)
        - If semester exists: semester grade != RA
        - If no semester: CA passing is sufficient
        """
        avg = self.ca_average
        if avg is None or avg < 30:
            return False
        if self.semester is not None and self.semester > 0:
            return self.sem_grade != "RA"
        return True


# ========================================
# ADMIN SCHEMAS
# ========================================
class AdminCreate(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=100)
    firebase_uid: str
    role: str = "teacher"  # "admin" or "teacher"


class AdminResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    is_active: bool
    last_login: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GoogleAuthRequest(BaseModel):
    id_token: str = Field(..., description="Firebase ID token from Google login")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    role: str


# ========================================
# CSV UPLOAD SCHEMAS
# ========================================
class CSVUploadResponse(BaseModel):
    success: bool
    message: str
    uploaded_count: int = 0
    error: Optional[str] = None


class CSVUploadLogResponse(BaseModel):
    id: int
    admin_id: int
    filename: str
    uploaded_records: int
    success: bool
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ========================================
# ANALYTICS SCHEMAS
# ========================================
class StudentDashboardResponse(BaseModel):
    student_id: int
    register_no: str
    name: str
    batch_year: str
    overall_average: float
    subjects_passed: int
    subjects_failed: int
    total_subjects: int
    rank: Optional[int]
    ca_averages: dict  # {"CA1": 78.5, "CA2": 81.2, "CA3": 84.1}
    semester_average: Optional[float]
    sem_published: bool = False  # Flag indicating if semester results are published


class ClassPerformanceResponse(BaseModel):
    batch_year: str
    total_students: int
    total_subjects: int
    class_average: float
    pass_percentage: float
    fail_percentage: float
    top_student: Optional[dict]
    bottom_student: Optional[dict]
    subject_averages: dict  # {"Math": 75.5, "Physics": 72.3, ...}


class StudentComparisonResponse(BaseModel):
    student1_id: int
    student2_id: int
    student1_name: str
    student2_name: str
    overall_average_1: float
    overall_average_2: float
    difference: float
    subjects_comparison: List[dict]  # [{"subject": "Math", "student1_ca_avg": 78, "student2_ca_avg": 75, ...}]


class BatchComparisonResponse(BaseModel):
    batch1_year: str
    batch2_year: str
    batch1_avg: float
    batch2_avg: float
    batch1_pass_rate: float
    batch2_pass_rate: float
    improvement: float
    top_subjects_batch1: List[dict]
    top_subjects_batch2: List[dict]


# ========================================
# ERROR RESPONSE SCHEMAS
# ========================================
class ErrorResponse(BaseModel):
    detail: str
    error_code: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Update forward references
StudentDetailResponse.update_forward_refs()
