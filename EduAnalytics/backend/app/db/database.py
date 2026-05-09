"""
Database configuration and session management
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from app.core.config import settings
from app.db.models import Base
import logging

logger = logging.getLogger(__name__)

# Database URL
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Create engine with connection pooling
# Use NullPool for SQLite, standard pooling for other RDBMS (MySQL/Postgres)
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    # Disable SQLAlchemy echo to avoid noisy PRAGMA/raw SQL logs during normal runs.
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
        pool_recycle=3600,
    )

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def init_db():
    """Initialize database - create all tables"""
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Database initialized successfully")


def get_db():
    """Dependency for getting database session in FastAPI routes"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
