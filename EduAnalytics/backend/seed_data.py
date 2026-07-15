#!/usr/bin/env python
"""Seed the database with initial test data"""

from app.db.database import SessionLocal
from app.db.models import Batch, Semester, Subject, BatchSubject, Admin, Student

def seed_database():
    db = SessionLocal()
    
    try:
        # Create Admin (if doesn't exist)
        existing_admin = db.query(Admin).filter(Admin.email == 'admin@example.com').first()
        if not existing_admin:
            admin = Admin(email='admin@example.com', name='Administrator', password_hash='admin123', role='admin')
            db.add(admin)
            db.commit()
            print('✓ Admin created')
        else:
            print('✓ Admin already exists')
        
        # Create Batches
        batch1 = Batch(batch_year=2025)
        batch2 = Batch(batch_year=2023)
        db.add_all([batch1, batch2])
        db.commit()
        print('✓ Batches created: 2025, 2023')
        
        # Create Semesters
        sem1_b1 = Semester(batch_id=batch1.id, semester_number=1, academic_year='2024-2025')
        sem1_b2 = Semester(batch_id=batch2.id, semester_number=1, academic_year='2022-2023')
        db.add_all([sem1_b1, sem1_b2])
        db.commit()
        print('✓ Semesters created')
        
        # Create Subjects
        subjects = [
            Subject(name='Mathematics', code='MATH101'),
            Subject(name='Physics', code='PHY101'),
            Subject(name='Chemistry', code='CHE101'),
            Subject(name='English', code='ENG101'),
            Subject(name='Biology', code='BIO101')
        ]
        db.add_all(subjects)
        db.commit()
        print('✓ Subjects created')
        
        # Create BatchSubject mappings
        for subj in subjects:
            bs1 = BatchSubject(batch_id=batch1.id, semester_id=sem1_b1.id, subject_id=subj.id)
            bs2 = BatchSubject(batch_id=batch2.id, semester_id=sem1_b2.id, subject_id=subj.id)
            db.add_all([bs1, bs2])
        db.commit()
        print('✓ BatchSubject mappings created')
        
        # Create Students
        students_data = [
            ('REG001', 'Alice', 'alice@example.com', '01-01-2005', batch1.id),
            ('REG002', 'Bob', 'bob@example.com', '02-02-2005', batch1.id),
            ('REG003', 'Carol', 'carol@example.com', '03-03-2005', batch1.id),
            ('REG004', 'David', 'david@example.com', '04-04-2005', batch1.id),
            ('REG005', 'Eve', 'eve@example.com', '05-05-2005', batch1.id),
            ('REG006', 'Frank', 'frank@example.com', '06-06-2003', batch2.id),
            ('REG007', 'Grace', 'grace@example.com', '07-07-2003', batch2.id),
            ('REG008', 'Henry', 'henry@example.com', '08-08-2003', batch2.id),
            ('REG009', 'Iris', 'iris@example.com', '09-09-2003', batch2.id),
            ('REG010', 'Jack', 'jack@example.com', '10-10-2003', batch2.id),
        ]
        for reg_no, name, email, dob, batch_id in students_data:
            student = Student(register_no=reg_no, name=name, email=email, date_of_birth=dob, batch_id=batch_id)
            db.add(student)
        db.commit()
        print('✓ 10 Students created')
        
        print('\n✓✓✓ Database seeded successfully! ✓✓✓')
    except Exception as e:
        print(f'Error: {e}')
        db.rollback()
    finally:
        db.close()

if __name__ == '__main__':
    seed_database()
