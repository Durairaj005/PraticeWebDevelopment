#!/usr/bin/env python
from app.db.database import SessionLocal
from app.db.models import Student

db = SessionLocal()
students = db.query(Student).order_by(Student.register_no).all()
print(f'Total students: {len(students)}')
for i, s in enumerate(students, 1):
    print(f'{i:2}. {s.register_no}: {s.name} (batch: {s.batch_id})')
db.close()
