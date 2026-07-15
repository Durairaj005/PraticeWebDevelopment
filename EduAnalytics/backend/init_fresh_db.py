"""
Initialize database with fresh schema
"""
import sys
sys.path.insert(0, 'c:\\Users\\LENOVO\\Desktop\\FINAL PROJECT\\EduAnalytics\\backend')

from app.db.database import Base, engine
from app.db.models import *

# Create all tables
Base.metadata.create_all(bind=engine)

# Verify tables exist
import sqlite3
conn = sqlite3.connect('eduanalytics.db')
cursor = conn.cursor()

cursor.execute("PRAGMA table_info(marks)")
columns = {col[1] for col in cursor.fetchall()}

required_cols = {'semester_marks', 'sem_grade', 'sem_published', 'ca1', 'ca2', 'ca3'}

conn.close()
