from app.db.base_class import Base
from app.models.user import User, StudentProfile, UserRole
from app.models.subject import Subject
from app.models.complaint import Complaint, ComplaintAttachment, ComplaintHistory, ComplaintStatus
from app.models.feedback import Feedback
from app.models.ai_analysis import AIAnalysis, Recommendation, AnalysisType, SentimentType, PriorityType
from app.models.report import Report, ReportType
from app.models.notification import Notification
from app.models.audit import AuditLog

# This file is imported by Alembic so it can discover all Base metadata
