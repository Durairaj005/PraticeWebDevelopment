#!/usr/bin/env python3
from app.db.database import SessionLocal
from app.db.models import Student

session = SessionLocal()
students = session.query(Student).all()

print(f'Student Login Credentials (DOB format check):\n')
for s in students:
    print(f'Reg: {s.register_no:12} | Name: {s.name:15} | DOB: "{s.date_of_birth}"')

print(f'\n✅ Use these credentials to login as students:')
print(f'Register No: CS2025001')
print(f'DOB: {students[0].date_of_birth} (or try the format from CSV)')

session.close()
