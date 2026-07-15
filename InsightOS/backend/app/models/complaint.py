import enum
from typing import List, Optional
from datetime import datetime
from sqlalchemy import String, Boolean, Enum, Integer, ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class ComplaintStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    resolved = "resolved"
    dismissed = "dismissed"

class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ComplaintStatus] = mapped_column(Enum(ComplaintStatus), default=ComplaintStatus.pending)
    category: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False)
    is_escalated: Mapped[bool] = mapped_column(Boolean, default=False)
    hod_remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    escalation_status: Mapped[str] = mapped_column(String, default="none") # none, escalated, acknowledged, cleared
    admin_remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    student: Mapped["User"] = relationship("User", back_populates="complaints")
    attachments: Mapped[List["ComplaintAttachment"]] = relationship("ComplaintAttachment", back_populates="complaint", cascade="all, delete-orphan")
    history: Mapped[List["ComplaintHistory"]] = relationship("ComplaintHistory", back_populates="complaint", cascade="all, delete-orphan")
    ai_analysis: Mapped[Optional["AIAnalysis"]] = relationship(
        "AIAnalysis",
        primaryjoin="and_(Complaint.id==AIAnalysis.reference_id, AIAnalysis.type=='complaint')",
        foreign_keys="AIAnalysis.reference_id",
        back_populates="complaint",
        uselist=False,
        cascade="all, delete-orphan",
    )

class ComplaintAttachment(Base):
    __tablename__ = "complaint_attachments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    complaint_id: Mapped[int] = mapped_column(ForeignKey("complaints.id", ondelete="CASCADE"), index=True)
    file_url: Mapped[str] = mapped_column(String, nullable=False) # Cloudinary URL
    file_type: Mapped[Optional[str]] = mapped_column(String)
    
    # Relationships
    complaint: Mapped["Complaint"] = relationship("Complaint", back_populates="attachments")

class ComplaintHistory(Base):
    __tablename__ = "complaint_history"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    complaint_id: Mapped[int] = mapped_column(ForeignKey("complaints.id", ondelete="CASCADE"), index=True)
    actor_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True) # User who made the change
    action: Mapped[str] = mapped_column(String, nullable=False) # e.g. "status_changed", "comment_added"
    details: Mapped[Optional[str]] = mapped_column(Text)
    
    # Relationships
    complaint: Mapped["Complaint"] = relationship("Complaint", back_populates="history")
    actor: Mapped[Optional["User"]] = relationship("User")
