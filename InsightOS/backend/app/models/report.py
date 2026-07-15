import enum
from datetime import datetime, timezone
from sqlalchemy import String, Enum, Integer, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class ReportType(str, enum.Enum):
    weekly = "weekly"
    monthly = "monthly"
    semester = "semester"
    annual = "annual"
    custom = "custom"

class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    generated_by_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    report_type: Mapped[ReportType] = mapped_column(Enum(ReportType), nullable=False)
    file_url: Mapped[str] = mapped_column(String, nullable=False) # URL to the generated PDF/Excel report
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    generated_by: Mapped["User"] = relationship("User")
