#!/usr/bin/env python3
"""Test student login"""
import sys
sys.path.insert(0, '/Users/LENOVO/Desktop/FINAL PROJECT/EduAnalytics/backend')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), 'eduanalytics.db')
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Import models
from app.db.models import Student

session = SessionLocal()

# Query first student
student = session.query(Student).filter(Student.register_no == "CS2025001").first()

if student:
    print(f"✓ Student Found:")
    print(f"  Register No: {student.register_no}")
    print(f"  Name: {student.name}")
    print(f"  DOB Type: {type(student.date_of_birth)}")
    print(f"  DOB Value: '{student.date_of_birth}'")
    print(f"  DOB Length: {len(str(student.date_of_birth))}")
    print(f"  DOB Repr: {repr(student.date_of_birth)}")
else:
    print("✗ Student not found")

session.close()
