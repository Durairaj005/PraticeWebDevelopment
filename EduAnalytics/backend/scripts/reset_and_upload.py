#!/usr/bin/env python3
"""
Reset database completely and upload new CSV files
"""
import os
import sqlite3
from pathlib import Path

# Delete the database file
db_path = Path(__file__).parent / "eduanalytics.db"
if db_path.exists():
    os.remove(db_path)
    print(f"✓ Deleted old database: {db_path}")

# Create fresh schema
from app.db import Base, engine
Base.metadata.create_all(bind=engine)
print("✓ Database schema created")

# Initialize batches, semesters, subjects, and admin
from app.db import SessionLocal
from app.models import Batch, Semester, Subject, Admin
from werkzeug.security import generate_password_hash

session = SessionLocal()

try:
    # Add batches
    batch_2025 = Batch(batch_year="2025")
    batch_2023 = Batch(batch_year="2023")
    session.add_all([batch_2025, batch_2023])
    session.flush()
    print(f"✓ Batches created: 2025 (ID={batch_2025.id}), 2023 (ID={batch_2023.id})")
    
    # Add semesters for each batch
    for batch in [batch_2025, batch_2023]:
        for sem_num in [1]:
            semester = Semester(batch_id=batch.id, semester_number=sem_num, academic_year="2025")
            session.add(semester)
    session.flush()
    print("✓ Semesters created")
    
    # Add subjects
    subjects_list = ["Mathematics", "Physics", "Chemistry", "English", "Biology"]
    for subj_name in subjects_list:
        subject = Subject(name=subj_name, code=subj_name[:3].upper())
        session.add(subject)
    session.flush()
    print(f"✓ Subjects created: {', '.join(subjects_list)}")
    
    # Add admin
    admin = Admin(
        email="admin@eduanalytics.com",
        name="Admin User",
        password_hash=generate_password_hash("admin123"),
        role="admin"
    )
    session.add(admin)
    session.commit()
    print("✓ Admin account created")
    
except Exception as e:
    session.rollback()
    print(f"✗ Error: {e}")
    raise
finally:
    session.close()

print("\n✅ Database reset complete! Ready for CSV upload.")
