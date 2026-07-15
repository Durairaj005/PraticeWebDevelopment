from sqlalchemy import String, Boolean, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base
import enum

class NotificationType(str, enum.Enum):
    SYSTEM = "SYSTEM"
    COMPLAINT_UPDATE = "COMPLAINT_UPDATE"
    MESSAGE = "MESSAGE"
class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")
