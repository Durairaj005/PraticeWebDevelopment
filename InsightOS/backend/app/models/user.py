import enum
from typing import Optional, List
from sqlalchemy import String, Boolean, Enum, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class UserRole(str, enum.Enum):
    student = "student"
    hod = "hod"
    admin = "admin"

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.student, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    profile_picture_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Relationships
    student_profile: Mapped[Optional["StudentProfile"]] = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    complaints: Mapped[List["Complaint"]] = relationship("Complaint", back_populates="student", foreign_keys="Complaint.student_id")
    feedbacks: Mapped[List["Feedback"]] = relationship("Feedback", back_populates="student", foreign_keys="Feedback.student_id")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    enrollment_number: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True)
    year: Mapped[Optional[int]] = mapped_column(Integer)
    semester: Mapped[Optional[int]] = mapped_column(Integer)
    passout_year: Mapped[Optional[int]] = mapped_column(Integer)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="student_profile")
