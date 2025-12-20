#!/usr/bin/env python
"""Test CSV upload endpoint with proper JWT authentication"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.security import create_access_token
from app.db.database import SessionLocal
from app.db.models import Student
import requests
import json

# Create a valid JWT token for admin ID 1
token = create_access_token({"sub": 1, "role": "admin"})
print(f"[OK] Created JWT token: {token[:50]}...")

# Read CSV file
csv_path = '../Current_Batch_2025_No_SemMarks.csv'
with open(csv_path, 'r') as f:
    csv_content = f.read()
    lines = csv_content.strip().split('\n')
    print(f"[OK] CSV file has {len(lines)-1} data rows (+ 1 header)")

# Upload via API
print("\n[INFO] Uploading CSV...")
files = {'file': ('test.csv', csv_content, 'text/csv')}
headers = {'Authorization': f'Bearer {token}'}

try:
    response = requests.post(
        'http://localhost:8000/api/v1/admin/csv-upload',
        files=files,
        headers=headers,
        timeout=30
    )
    print(f"[OK] Response status: {response.status_code}")
    print(f"[OK] Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"[ERROR] {e}")

# Check database
print("\n[INFO] Checking database...")
db = SessionLocal()
student_count = db.query(Student).count()
print(f"[OK] Total students in DB: {student_count}")
db.close()
