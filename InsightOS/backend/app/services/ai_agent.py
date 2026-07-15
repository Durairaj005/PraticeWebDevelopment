import json
import logging
from sqlalchemy.orm import Session
from app.models.ai_analysis import AIAnalysis, SentimentType, PriorityType
from app.models.complaint import Complaint
from app.core.config import settings

# In a real app, this would use google.generativeai and Langchain. 
# We'll build the robust service here, but provide a robust fallback if API key is missing.

try:
    import google.generativeai as genai
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_groq import ChatGroq
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import JsonOutputParser
    HAS_AI = True
except ImportError:
    HAS_AI = False

logger = logging.getLogger(__name__)

def analyze_complaint(db: Session, complaint_id: int) -> None:
    """
    Background task to analyze a complaint using Gemini or Groq.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        return

    # Check if we already analyzed it
    existing_analysis = db.query(AIAnalysis).filter(AIAnalysis.reference_id == complaint_id, AIAnalysis.type == "complaint").first()
    if existing_analysis:
        return

    if not HAS_AI:
        logger.warning("AI libraries missing. Using fallback analysis.")
        _fallback_analysis(db, complaint)
        return

    try:
        if settings.PRIMARY_AGENT_PROVIDER == "groq" and settings.GROQ_API_KEY:
            llm = ChatGroq(
                model="llama3-8b-8192",
                temperature=0,
                api_key=settings.GROQ_API_KEY
            )
        elif settings.GEMINI_API_KEY:
            llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                temperature=0,
                google_api_key=settings.GEMINI_API_KEY
            )
        else:
            logger.warning("No API Key configured. Using fallback analysis.")
            _fallback_analysis(db, complaint)
            return

        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert AI administrator for a university department.
Analyze the following student complaint and return a JSON object with EXACTLY these keys:
- 'category': A short category string (e.g., 'Academic', 'Infrastructure', 'Hostel', 'Faculty', 'Other').
- 'sentiment': Must be one of: 'positive', 'neutral', 'negative'.
- 'emotion': A single word describing the student's emotion (e.g., 'frustrated', 'angry', 'concerned', 'happy').
- 'priority': Must be one of: 'low', 'medium', 'high', 'critical'.
- 'recommended_action': A short sentence recommending what the HOD should do.
Return ONLY valid JSON. Do not include markdown blocks like ```json"""),
            ("human", "Title: {title}\nDescription: {description}")
        ])

        parser = JsonOutputParser()
        chain = prompt | llm | parser

        result = chain.invoke({
            "title": complaint.title,
            "description": complaint.description
        })

        analysis = AIAnalysis(
            reference_id=complaint.id,
            type="complaint",
            topic_category=result.get("category", "General"),
            sentiment=SentimentType(result.get("sentiment", "neutral").lower()),
            emotion=result.get("emotion", "neutral"),
            priority=PriorityType(result.get("priority", "medium").lower())
        )
        db.add(analysis)
        db.commit()

    except Exception as e:
        logger.error(f"AI Analysis failed: {e}")
        _fallback_analysis(db, complaint)


def _fallback_analysis(db: Session, complaint: Complaint) -> None:
    """Fallback logic if API fails or is not configured."""
    text = (complaint.title + " " + complaint.description).lower()
    
    priority = PriorityType.medium
    sentiment = SentimentType.neutral
    emotion = "neutral"
    
    if "urgent" in text or "emergency" in text or "harassment" in text:
        priority = PriorityType.critical
        sentiment = SentimentType.negative
        emotion = "distressed"
    elif "angry" in text or "terrible" in text or "worst" in text:
        priority = PriorityType.high
        sentiment = SentimentType.negative
        emotion = "angry"
        
    analysis = AIAnalysis(
        reference_id=complaint.id,
        type="complaint",
        topic_category="General",
        sentiment=sentiment,
        emotion=emotion,
        priority=priority
    )
    db.add(analysis)
    db.commit()
