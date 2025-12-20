#!/usr/bin/env python3
"""
Test CSV upload to verify data persistence fix
"""
import jwt
import requests
import json
from datetime import datetime

# Admin credentials
ADMIN_EMAIL = "test@example.com"
ADMIN_PASSWORD = "password123"
API_URL = "http://localhost:8000/api/v1"

print("=" * 70)
print("TESTING CSV UPLOAD FIX - DATA PERSISTENCE VERIFICATION")
print("=" * 70)

# Step 1: Get admin login token
print("\n[Step 1] Getting admin JWT token...")
login_response = requests.post(
    f"{API_URL}/admin/login",
    json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
)

if login_response.status_code != 200:
    print(f"  ❌ Login failed: {login_response.text}")
    exit(1)

token = login_response.json()["access_token"]
print(f"  ✓ Got token: {token[:20]}...")

# Step 2: Check current database state BEFORE upload
print("\n[Step 2] Checking database BEFORE upload...")
headers = {"Authorization": f"Bearer {token}"}
before_response = requests.get(f"{API_URL}/admin/all-students", headers=headers)

if before_response.status_code == 200:
    before_count = len(before_response.json())
    print(f"  ✓ Students before upload: {before_count}")
else:
    print(f"  ❌ Failed to get student count: {before_response.text}")
    before_count = 0

# Step 3: Upload test CSV file
print("\n[Step 3] Uploading test CSV file...")
test_csv_path = "Current_Batch_2025_No_SemMarks.csv"

try:
    with open(test_csv_path, 'r') as f:
        files = {'file': (test_csv_path, f)}
        upload_response = requests.post(
            f"{API_URL}/admin/csv-upload",
            files=files,
            headers=headers,
            data={"batch_type": "current"}
        )
    
    if upload_response.status_code == 200:
        upload_data = upload_response.json()
        print(f"  ✓ Upload response: {upload_data.get('message', 'Success')}")
        print(f"    - Uploaded records: {upload_data.get('uploaded_records', 0)}")
        print(f"    - Success: {upload_data.get('success', True)}")
    else:
        print(f"  ❌ Upload failed: {upload_response.status_code}")
        print(f"     {upload_response.text}")
except Exception as e:
    print(f"  ❌ Error during upload: {str(e)}")
    exit(1)

# Step 4: Check database state AFTER upload
print("\n[Step 4] Checking database AFTER upload...")
import time
time.sleep(1)  # Wait a moment for commit

after_response = requests.get(f"{API_URL}/admin/all-students", headers=headers)
if after_response.status_code == 200:
    after_count = len(after_response.json())
    print(f"  ✓ Students after upload: {after_count}")
else:
    print(f"  ❌ Failed to get student count: {after_response.text}")
    after_count = before_count

# Step 5: Verify persistence
print("\n[Step 5] VERIFICATION RESULT:")
print("=" * 70)
if after_count > before_count:
    print(f"  ✅ SUCCESS! Data persisted!")
    print(f"     Before: {before_count} students")
    print(f"     After:  {after_count} students")
    print(f"     New records: {after_count - before_count}")
else:
    print(f"  ❌ FAILED! Data NOT persisted!")
    print(f"     Before: {before_count} students")
    print(f"     After:  {after_count} students")
    print(f"     Change: 0 records added")
    print(f"\n  This means the upload endpoint still has a persistence issue.")

print("=" * 70)
