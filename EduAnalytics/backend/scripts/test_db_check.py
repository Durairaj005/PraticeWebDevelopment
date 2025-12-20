#!/usr/bin/env python
"""Check database contents"""

from app.db.database import SessionLocal
from app.db.models import Batch, Student, Mark

db = SessionLocal()

batches = db.query(Batch).all()
print(f'Total batches: {len(batches)}')
for b in batches:
    students_in_batch = [s for s in b.students]
    print(f'  - Batch {b.batch_year} (ID={b.id}): {len(students_in_batch)} students')

students = db.query(Student).all()
print(f'\nTotal students: {len(students)}')
for s in students[:3]:  # Show first 3
    print(f'  - {s.name} (ID={s.id}, Batch={s.batch_id})')

marks = db.query(Mark).all()
print(f'\nTotal marks: {len(marks)}')
if marks:
    print(f'  Sample mark: Student={marks[0].student_id}, Subject={marks[0].subject_id}, Marks={marks[0].semester_marks}')

db.close()
print("\n✓ Database check complete")
