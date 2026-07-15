from typing import Optional
from datetime import datetime
from pydantic import BaseModel
# Shared properties
class FeedbackBase(BaseModel):
    content: str
    is_anonymous: bool = True
    subject_id: Optional[int] = None

# Properties to receive on creation
class FeedbackCreate(FeedbackBase):
    pass

# Properties to return
class FeedbackInDBBase(FeedbackBase):
    id: int
    student_id: int
    created_at: datetime
    
    model_config = {"from_attributes": True}

class FeedbackRead(FeedbackInDBBase):
    pass
