from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.complaint import ComplaintStatus
from app.schemas.complaint_attachment import ComplaintAttachmentRead

# Shared properties
class ComplaintBase(BaseModel):
    title: str
    description: str
    category: Optional[str] = None
    is_anonymous: bool = False

# Properties to receive on creation
class ComplaintCreate(ComplaintBase):
    pass

# Properties to receive on status update (HOD/Admin)
class ComplaintUpdate(BaseModel):
    status: Optional[ComplaintStatus] = None
    is_escalated: Optional[bool] = None
    hod_remarks: Optional[str] = None
    escalation_status: Optional[str] = None
    admin_remarks: Optional[str] = None

# Properties to return
class ComplaintInDBBase(ComplaintBase):
    id: int
    student_id: int
    status: ComplaintStatus
    is_escalated: bool
    hod_remarks: Optional[str] = None
    escalation_status: str
    admin_remarks: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}

class ComplaintRead(ComplaintInDBBase):
    attachments: List[ComplaintAttachmentRead] = []

