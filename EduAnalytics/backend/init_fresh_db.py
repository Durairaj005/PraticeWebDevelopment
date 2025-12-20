"""
Initialize database with fresh schema
"""
import sys
sys.path.insert(0, 'c:\\Users\\LENOVO\\Desktop\\FINAL PROJECT\\EduAnalytics\\backend')

from app.db.database import Base, engine
from app.db.models import *

# Create all tables
Base.metadata.create_all(bind=engine)

print("[OK] Database schema created successfully!")

# Verify tables exist
import sqlite3
conn = sqlite3.connect('eduanalytics.db')
cursor = conn.cursor()

cursor.execute("PRAGMA table_info(marks)")
columns = {col[1] for col in cursor.fetchall()}

print("\nMarks table columns:")
required_cols = {'semester_marks', 'sem_grade', 'sem_published', 'ca1', 'ca2', 'ca3'}
for col in sorted(required_cols):
    status = "[OK]" if col in columns else "[FAIL]"
    print(f"  {status} {col}")

conn.close()
