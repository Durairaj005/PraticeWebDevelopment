#!/usr/bin/env python3
"""Test CSV upload to the backend"""

import sys
sys.path.insert(0, '.')

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.db.models import Student, Batch, Semester, Subject, Mark, Admin, Base
import csv

# Initialize database
print("Initializing database...")
Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # Create test admin if doesn't exist
    admin = db.query(Admin).first()
    if not admin:
        admin = Admin(email="admin@test.com", name="Test Admin", is_active=True)
        db.add(admin)
        db.commit()
        print("Created test admin")
    
    # Read and process CSV
    csv_file = "../Sample_Student_Marks.csv"
    print(f"\nReading {csv_file}...")
    
    success_count = 0
    error_count = 0
    errors = []
    
    with open(csv_file, 'r') as f:
        csv_reader = csv.DictReader(f)
        
        for row_num, row in enumerate(csv_reader, start=2):
            try:
                # Parse required fields
                register_no = row.get('Register_No', '').strip()
                student_name = row.get('Student_Name', '').strip()
                email = row.get('Email', '').strip()
                dob = row.get('Date_of_Birth', '').strip()
                batch_year = row.get('Batch_Year', '').strip()
                semester_num = row.get('Semester', '1').strip()
                subject_name = row.get('Subject_Name', '').strip()
                
                if not all([register_no, student_name, email, dob, batch_year, subject_name]):
                    error_count += 1
                    errors.append(f"Row {row_num}: Missing required fields")
                    continue
                
                # Find or create batch
                batch = db.query(Batch).filter(Batch.batch_year == batch_year).first()
                if not batch:
                    batch = Batch(batch_year=batch_year)
                    db.add(batch)
                    db.flush()
                    print(f"  Created Batch: {batch_year}")
                
                # Find or create student
                student = db.query(Student).filter(
                    Student.register_no == register_no
                ).first()
                
                if not student:
                    student = Student(
                        register_no=register_no,
                        name=student_name,
                        email=email,
                        date_of_birth=dob,
                        batch_id=batch.id
                    )
                    db.add(student)
                    db.flush()
                    print(f"  Created Student: {student_name} ({register_no})")
                else:
                    student.date_of_birth = dob
                    student.batch_id = batch.id
                    db.flush()
                
                # Find or create subject
                subject = db.query(Subject).filter(
                    Subject.name == subject_name
                ).first()
                
                if not subject:
                    subject = Subject(name=subject_name, code=subject_name[:10].upper())
                    db.add(subject)
                    db.flush()
                    print(f"  Created Subject: {subject_name}")
                
                # Find or create semester
                semester = db.query(Semester).filter(
                    Semester.batch_id == batch.id,
                    Semester.semester_number == int(semester_num)
                ).first()
                
                if not semester:
                    semester = Semester(
                        batch_id=batch.id,
                        semester_number=int(semester_num),
                        academic_year=f"{batch_year}-{int(batch_year)+1}"
                    )
                    db.add(semester)
                    db.flush()
                    print(f"  Created Semester: {semester_num}")
                
                # Create or update mark
                mark = db.query(Mark).filter(
                    Mark.student_id == student.id,
                    Mark.subject_id == subject.id,
                    Mark.semester_id == semester.id
                ).first()
                
                if not mark:
                    mark = Mark(
                        student_id=student.id,
                        subject_id=subject.id,
                        semester_id=semester.id
                    )
                    db.add(mark)
                
                mark.ca1 = float(row.get('CA1', 0)) if row.get('CA1') else None
                mark.ca2 = float(row.get('CA2', 0)) if row.get('CA2') else None
                mark.ca3 = float(row.get('CA3', 0)) if row.get('CA3') else None
                mark.semester_marks = float(row.get('Semester_Marks', 0)) if row.get('Semester_Marks') else None
                
                success_count += 1
                
            except Exception as e:
                error_count += 1
                errors.append(f"Row {row_num}: {str(e)}")
                db.rollback()
    
    # Final commit
    db.commit()
    
    print("\n[SUCCESS] Upload complete!")
    print(f"  Success: {success_count} rows")
    print(f"  Errors: {error_count} rows")
    
    if errors:
        print(f"\n[ERRORS FOUND:]")
        for error in errors[:5]:
            print(f"  - {error}")
    
    # Verify data
    print(f"\n[DATABASE VERIFICATION:]")
    print(f"  Batches: {db.query(Batch).count()}")
    print(f"  Students: {db.query(Student).count()}")
    print(f"  Subjects: {db.query(Subject).count()}")
    print(f"  Semesters: {db.query(Semester).count()}")
    print(f"  Marks: {db.query(Mark).count()}")
    
finally:
    db.close()
