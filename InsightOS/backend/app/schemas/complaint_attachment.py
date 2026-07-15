from typing import Optional
from pydantic import BaseModel

class ComplaintAttachmentBase(BaseModel):
    file_url: str
    file_type: Optional[str] = None

class ComplaintAttachmentCreate(ComplaintAttachmentBase):
    complaint_id: int

class ComplaintAttachmentInDBBase(ComplaintAttachmentBase):
    id: int
    complaint_id: int
    
    model_config = {"from_attributes": True}

class ComplaintAttachmentRead(ComplaintAttachmentInDBBase):
    pass
