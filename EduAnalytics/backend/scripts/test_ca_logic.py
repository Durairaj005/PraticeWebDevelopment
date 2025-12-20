"""
Test script to verify CA average logic with 2 and 3 CA exams.
This validates the corrected pass/fail criteria.
"""

import sys
sys.path.insert(0, '.')

from app.db.models import Mark, Student, Subject, Semester, Batch, Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Create test database
engine = create_engine('sqlite:///:memory:')
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
session = Session()

# Create test data
batch = Batch(batch_year=2024, created_at=datetime.now(), updated_at=datetime.now())
session.add(batch)
session.commit()

student = Student(
    register_no='CS2024001',
    name='Test Student',
    email='test@example.com',
    date_of_birth='15-01-2005',
    batch_id=batch.id
)
session.add(student)
session.commit()

subject = Subject(name='Mathematics', code='MA101')
session.add(subject)
session.commit()

semester = Semester(batch_id=batch.id, semester_number=1, academic_year='2024-2025')
session.add(semester)
session.commit()

# Test Cases
test_cases = [
    {
        'name': 'Test 1: 3 CAs all 30 - (30+30+30)/3 = 30 → PASS',
        'ca1': 30, 'ca2': 30, 'ca3': 30,
        'expected_avg': 30.0,
        'expected_status': 'Passed'
    },
    {
        'name': 'Test 2: 2 CAs both 30 - (30+30)/2 = 30 → PASS',
        'ca1': 30, 'ca2': 30, 'ca3': None,
        'expected_avg': 30.0,
        'expected_status': 'Passed'
    },
    {
        'name': 'Test 3: 2 CAs (25+20)/2 = 22.5 → FAIL',
        'ca1': 25, 'ca2': 20, 'ca3': None,
        'expected_avg': 22.5,
        'expected_status': 'Failed'
    },
    {
        'name': 'Test 4: 3 CAs (35+30+25)/3 = 30 → PASS',
        'ca1': 35, 'ca2': 30, 'ca3': 25,
        'expected_avg': 30.0,
        'expected_status': 'Passed'
    },
    {
        'name': 'Test 5: 2 CAs (40+25)/2 = 32.5 → PASS',
        'ca1': 40, 'ca2': 25, 'ca3': None,
        'expected_avg': 32.5,
        'expected_status': 'Passed'
    },
    {
        'name': 'Test 6: 3 CAs (25+25+25)/3 = 25 → FAIL',
        'ca1': 25, 'ca2': 25, 'ca3': 25,
        'expected_avg': 25.0,
        'expected_status': 'Failed'
    },
    {
        'name': 'Test 7: 1 CA only (30) → FAIL (needs at least 2)',
        'ca1': 30, 'ca2': None, 'ca3': None,
        'expected_avg': None,
        'expected_status': 'Failed'
    },
]

print("=" * 80)
print("CA AVERAGE CALCULATION TEST SUITE")
print("=" * 80)
print()

passed_count = 0
failed_count = 0

for test_case in test_cases:
    # Create mark record
    mark = Mark(
        student_id=student.id,
        subject_id=subject.id,
        semester_id=semester.id,
        ca1=test_case['ca1'],
        ca2=test_case['ca2'],
        ca3=test_case['ca3'],
        semester_marks=None  # No semester marks for CA testing
    )
    
    print(f"📋 {test_case['name']}")
    print(f"   CA1={test_case['ca1']}, CA2={test_case['ca2']}, CA3={test_case['ca3']}")
    
    actual_avg = mark.ca_average
    actual_status = mark.ca_status
    
    avg_match = actual_avg == test_case['expected_avg']
    status_match = actual_status == test_case['expected_status']
    
    print(f"   Expected: Average={test_case['expected_avg']}, Status={test_case['expected_status']}")
    print(f"   Actual:   Average={actual_avg}, Status={actual_status}")
    
    if avg_match and status_match:
        print(f"   ✅ PASS")
        passed_count += 1
    else:
        print(f"   ❌ FAIL")
        if not avg_match:
            print(f"      - Average mismatch: expected {test_case['expected_avg']}, got {actual_avg}")
        if not status_match:
            print(f"      - Status mismatch: expected {test_case['expected_status']}, got {actual_status}")
        failed_count += 1
    
    print()

print("=" * 80)
print(f"RESULTS: {passed_count} passed, {failed_count} failed out of {len(test_cases)} tests")
print("=" * 80)

if failed_count == 0:
    print("✅ All tests passed! CA average logic is correct.")
else:
    print(f"❌ {failed_count} test(s) failed. Please review the logic.")
