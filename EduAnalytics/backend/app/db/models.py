"""
SQLAlchemy Models for EduAnalytics
- Students
- Marks (CA1, CA2, CA3, Semester)
- Batches
- Semesters
- Admin accounts
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, Enum, UniqueConstraint, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()


class Batch(Base):
    """Batch/Year table (e.g., 2024, 2023, 2022)"""
    __tablename__ = "batches"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_year = Column(String(4), unique=True, nullable=False, index=True)  # e.g., "2024"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    students = relationship("Student", back_populates="batch", cascade="all, delete-orphan")
    semesters = relationship("Semester", back_populates="batch", cascade="all, delete-orphan")
    batch_subjects = relationship("BatchSubject", back_populates="batch", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Batch {self.batch_year}>"


class Semester(Base):
    """Semester table (Sem 1, Sem 2, Sem 3, Sem 4, etc.)"""
    __tablename__ = "semesters"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    semester_number = Column(Integer, nullable=False)  # 1, 2, 3, 4
    academic_year = Column(String(9), nullable=False)  # e.g., "2024-2025"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    batch = relationship("Batch", back_populates="semesters")
    marks = relationship("Mark", back_populates="semester", cascade="all, delete-orphan")
    batch_subjects = relationship("BatchSubject", back_populates="semester", cascade="all, delete-orphan")
    
    # Unique constraint: one semester per batch
    __table_args__ = (
        UniqueConstraint('batch_id', 'semester_number', name='unique_batch_semester'),
        Index('idx_semester_batch', 'batch_id'),
    )
    
    def __repr__(self):
        return f"<Semester {self.semester_number}>"


class Student(Base):
    """Students table"""
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    register_no = Column(String(20), unique=True, nullable=False, index=True)  # e.g., "CS2024001"
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    date_of_birth = Column(String(20), nullable=False)  # Stored as "DD-MM-YYYY" for login
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    batch = relationship("Batch", back_populates="students")
    marks = relationship("Mark", back_populates="student", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_student_batch', 'batch_id'),
        Index('idx_student_register_no', 'register_no'),
    )
    
    def __repr__(self):
        return f"<Student {self.register_no} - {self.name}>"


class Subject(Base):
    """Subjects table (Math, Physics, Chemistry, CS, English, etc.)"""
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)  # e.g., "Mathematics"
    code = Column(String(20), unique=True, nullable=False)  # e.g., "MATH101"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    marks = relationship("Mark", back_populates="subject", cascade="all, delete-orphan")
    batch_subjects = relationship("BatchSubject", back_populates="subject", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Subject {self.name}>"


class BatchSubject(Base):
    """Batch-Semester-Subject mapping table - Defines which subjects belong to which batch-semester combination"""
    __tablename__ = "batch_subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=True)  # If NULL, applies to all semesters
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    batch = relationship("Batch", back_populates="batch_subjects")
    semester = relationship("Semester", back_populates="batch_subjects")
    subject = relationship("Subject", back_populates="batch_subjects")
    
    # Unique constraint: one subject per batch-semester combination
    __table_args__ = (
        UniqueConstraint('batch_id', 'semester_id', 'subject_id', name='unique_batch_semester_subject'),
        Index('idx_batch_subject_batch', 'batch_id'),
        Index('idx_batch_subject_semester', 'semester_id'),
        Index('idx_batch_subject_subject', 'subject_id'),
    )
    
    def __repr__(self):
        return f"<BatchSubject batch_id={self.batch_id} semester_id={self.semester_id} subject_id={self.subject_id}>"


class Mark(Base):
    """Marks/Scores table - Stores CA1, CA2, CA3, and Semester marks per student per subject"""
    __tablename__ = "marks"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    
    # CA marks (Continuous Assessment)
    ca1 = Column(Float, nullable=True)  # CA1 marks (0-100)
    ca2 = Column(Float, nullable=True)  # CA2 marks (0-100)
    ca3 = Column(Float, nullable=True)  # CA3 marks (0-100)
    
    # Semester marks (Raw marks - optional)
    semester_marks = Column(Float, nullable=True)  # Semester exam marks (0-100)
    
    # Semester Grade (After grading - optional)
    sem_grade = Column(String(2), nullable=True)  # O, A+, A, B+, B, C, RA
    
    # Flag to indicate if semester results are published
    sem_published = Column(Boolean, default=False)  # True when SEM grades are entered
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    student = relationship("Student", back_populates="marks")
    subject = relationship("Subject", back_populates="marks")
    semester = relationship("Semester", back_populates="marks")
    
    # Unique constraint: one entry per student per subject per semester
    __table_args__ = (
        UniqueConstraint('student_id', 'subject_id', 'semester_id', name='unique_student_subject_semester'),
        Index('idx_mark_student', 'student_id'),
        Index('idx_mark_subject', 'subject_id'),
        Index('idx_mark_semester', 'semester_id'),
    )
    
    def __repr__(self):
        return f"<Mark student_id={self.student_id} subject_id={self.subject_id}>"
    
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
        if self.semester_marks is None or self.semester_marks <= 0:
            return None
        
        marks = self.semester_marks
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
        if self.semester_marks is None or self.semester_marks <= 0:
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
        
        if self.semester_marks is not None and self.semester_marks > 0:
            return self.sem_grade != "RA"
        
        return True


class RoleEnum(str, enum.Enum):
    """Admin role enum"""
    ADMIN = "admin"
    TEACHER = "teacher"


class Admin(Base):
    """Admin/Teacher accounts table"""
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    role = Column(String(20), default="teacher", nullable=False)  # admin or teacher
    password_hash = Column(String(255), nullable=True)  # For password-based login
    firebase_uid = Column(String(255), unique=True, nullable=True)  # Firebase UID from Google login (optional)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_admin_email', 'email'),
        Index('idx_admin_firebase_uid', 'firebase_uid'),
    )
    
    def __repr__(self):
        return f"<Admin {self.email}>"


class CSVUploadLog(Base):
    """Log of CSV uploads for audit trail"""
    __tablename__ = "csv_upload_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("admins.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    uploaded_records = Column(Integer, default=0)  # How many records were uploaded
    success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)  # Error details if failed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_csv_admin', 'admin_id'),
        Index('idx_csv_created', 'created_at'),
    )
    
    def __repr__(self):
        return f"<CSVUploadLog {self.filename}>"
