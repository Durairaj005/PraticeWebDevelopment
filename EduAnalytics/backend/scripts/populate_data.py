#!/usr/bin/env python
"""Populate database with sample data for testing"""

from app.db.database import SessionLocal
from app.db.models import Batch, Semester, Subject, Student, Mark
from datetime import datetime

def populate_data():
    db = SessionLocal()
    
    # 1. Create Batches
    batch_2024 = Batch(batch_year="2024")
    batch_2023 = Batch(batch_year="2023")
    db.add_all([batch_2024, batch_2023])
    db.commit()
    print("✓ Batches created")
    
    # 2. Create Semesters
    sem1 = Semester(semester_number=1, batch_id=batch_2024.id, academic_year="2024-25")
    sem2 = Semester(semester_number=2, batch_id=batch_2024.id, academic_year="2024-25")
    db.add_all([sem1, sem2])
    db.commit()
    print("✓ Semesters created")
    
    # 3. Create Subjects
    subjects_data = ["Math", "Physics", "Chemistry", "CS", "English"]
    subjects = [Subject(name=name) for name in subjects_data]
    db.add_all(subjects)
    db.commit()
    print(f"✓ Subjects created: {subjects_data}")
    
    # 4. Create Students in batch 2024
    students_data = [
        {"name": "Raj Kumar", "register_no": "CS2024001", "email": "raj@edu.com", "dob": "03/15/2005"},
        {"name": "Priya Sharma", "register_no": "CS2024002", "email": "priya@edu.com", "dob": "05/22/2005"},
        {"name": "Indumathi", "register_no": "CS2024003", "email": "indumathi@edu.com", "dob": "07/18/2005"},
        {"name": "Vikram Singh", "register_no": "CS2024004", "email": "vikram@edu.com", "dob": "02/10/2005"},
        {"name": "Anjali Verma", "register_no": "CS2024005", "email": "anjali@edu.com", "dob": "08/25/2005"},
    ]
    
    students = []
    for data in students_data:
        dob = datetime.strptime(data["dob"], "%m/%d/%Y").date()
        student = Student(
            name=data["name"],
            register_no=data["register_no"],
            email=data["email"],
            date_of_birth=dob,
            batch_id=batch_2024.id
        )
        students.append(student)
    
    db.add_all(students)
    db.commit()
    print(f"✓ Students created in batch 2024: {len(students)} students")
    
    # 5. Create Marks for each student and subject
    for student in students:
        for subject in subjects:
            mark = Mark(
                student_id=student.id,
                subject_id=subject.id,
                semester_id=sem1.id,
                ca1=15 + (student.id * 2) % 10,  # CA1 score
                ca2=16 + (student.id * 3) % 10,  # CA2 score
                ca3=14 + (student.id * 2) % 10,  # CA3 score
                semester=35 + (student.id * 5) % 20  # Semester marks
            )
            db.add(mark)
    
    db.commit()
    marks_count = db.query(Mark).count()
    print(f"✓ Marks created: {marks_count} total marks records")
    
    # 6. Verify data
    print("\n" + "="*60)
    print("VERIFICATION:")
    print("="*60)
    print(f"Batches: {db.query(Batch).count()}")
    print(f"Semesters: {db.query(Semester).count()}")
    print(f"Subjects: {db.query(Subject).count()}")
    print(f"Students: {db.query(Student).count()}")
    print(f"Marks: {db.query(Mark).count()}")
    
    # Check a student's data
    student = students[0]
    marks = db.query(Mark).filter(Mark.student_id == student.id).all()
    print(f"\nSample: Student '{student.name}' has {len(marks)} mark records")
    
    db.close()
    print("\n✓ Database populated successfully!")

if __name__ == "__main__":
    populate_data()
