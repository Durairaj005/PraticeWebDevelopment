from typing import Optional
from sqlalchemy import Boolean, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class Feedback(Base):
    __tablename__ = "feedbacks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    subject_id: Mapped[Optional[int]] = mapped_column(ForeignKey("subjects.id", ondelete="SET NULL"), index=True, nullable=True) # Nullable for general feedback
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationships
    student: Mapped["User"] = relationship("User", back_populates="feedbacks")
    subject: Mapped[Optional["Subject"]] = relationship("Subject", back_populates="feedbacks")
    ai_analysis: Mapped[Optional["AIAnalysis"]] = relationship(
        "AIAnalysis",
        primaryjoin="and_(Feedback.id==AIAnalysis.reference_id, AIAnalysis.type=='feedback')",
        foreign_keys="AIAnalysis.reference_id",
        back_populates="feedback",
        uselist=False,
        cascade="all, delete-orphan",
        overlaps="ai_analysis,complaint",
    )
