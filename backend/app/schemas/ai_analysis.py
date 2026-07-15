from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.ai_analysis import PriorityType, SentimentType

class AIAnalysisBase(BaseModel):
    category: str
    sentiment: SentimentType
    emotion: Optional[str] = None
    priority: PriorityType
    recommended_action: Optional[str] = None
    duplicate_cluster_id: Optional[str] = None

class AIAnalysisCreate(AIAnalysisBase):
    pass

class AIAnalysisInDBBase(AIAnalysisBase):
    id: int
    complaint_id: Optional[int] = None
    feedback_id: Optional[int] = None
    analyzed_at: datetime
    
    model_config = {"from_attributes": True}

class AIAnalysisRead(AIAnalysisInDBBase):
    pass
