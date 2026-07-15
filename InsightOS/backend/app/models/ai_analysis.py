import enum
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy import String, Enum, Integer, ForeignKey, Text, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class AnalysisType(str, enum.Enum):
    complaint = "complaint"
    feedback = "feedback"

class SentimentType(str, enum.Enum):
    positive = "positive"
    negative = "negative"
    neutral = "neutral"

class PriorityType(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"

class AIAnalysis(Base):
    __tablename__ = "ai_analysis"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    reference_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False) # Complaint or Feedback ID
    type: Mapped[AnalysisType] = mapped_column(Enum(AnalysisType), index=True, nullable=False)
    
    # Classification
    topic_category: Mapped[Optional[str]] = mapped_column(String, index=True)
    
    # Sentiment & Emotion
    sentiment: Mapped[Optional[SentimentType]] = mapped_column(Enum(SentimentType), index=True)
    emotion: Mapped[Optional[str]] = mapped_column(String) # e.g., Happy, Angry, Frustrated
    
    # Priority & Duplication
    priority: Mapped[Optional[PriorityType]] = mapped_column(Enum(PriorityType), index=True)
    duplicate_cluster_id: Mapped[Optional[str]] = mapped_column(String, index=True) # Used by ChromaDB / Sentence Transformers
    
    analyzed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships (Using primaryjoin since reference_id is dynamic)
    complaint: Mapped[Optional["Complaint"]] = relationship("Complaint", primaryjoin="and_(AIAnalysis.reference_id==Complaint.id, AIAnalysis.type=='complaint')", back_populates="ai_analysis", foreign_keys="AIAnalysis.reference_id", overlaps="ai_analysis")
    feedback: Mapped[Optional["Feedback"]] = relationship("Feedback", primaryjoin="and_(AIAnalysis.reference_id==Feedback.id, AIAnalysis.type=='feedback')", back_populates="ai_analysis", foreign_keys="AIAnalysis.reference_id", overlaps="ai_analysis,complaint")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    impact_score: Mapped[Optional[float]] = mapped_column(Float) # To prioritize recommendations
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
