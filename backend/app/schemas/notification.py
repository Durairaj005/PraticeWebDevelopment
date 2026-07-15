from typing import Optional
from datetime import datetime
from pydantic import BaseModel

# Properties to return to client
class NotificationRead(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
