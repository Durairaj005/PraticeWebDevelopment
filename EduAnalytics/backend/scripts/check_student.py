#!/usr/bin/env python
from app.db.database import SessionLocal
from app.db.models import Student

db = SessionLocal()
student = db.query(Student).filter(Student.register_no == 'CS2025001').first()
if student:
    print(f'Register: {student.register_no}')
    print(f'Name: {student.name}')
    print(f'Email: {student.email}')
    print(f'DOB: {student.date_of_birth}')
    print(f'Batch ID: {student.batch_id}')
else:
    print('Student not found')
db.close()
