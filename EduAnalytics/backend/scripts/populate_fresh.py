#!/usr/bin/env python
"""Fresh population script with better error handling"""

import os
import sys
from datetime import datetime

# Ensure fresh imports
if 'app.db.database' in sys.modules:
    del sys.modules['app.db.database']
if 'app.db.models' in sys.modules:
    del sys.modules['app.db.models']

from app.db.database import SessionLocal, engine, Base
from app.db.models import Batch, Semester, Subject, Student, Mark

def populate_data():
    # Recreate all tables
    print("Creating tables...")
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    print("✓ Tables created")
    
    db = SessionLocal()
    try:
        # 1. Create Batches
        print("Creating batches...")
        batch_2024 = Batch(batch_year="2024")
        batch_2023 = Batch(batch_year="2023")
        db.add_all([batch_2024, batch_2023])
        db.flush()
        print("✓ Batches created")
        
        # 2. Create Semesters
        print("Creating semesters...")
        sem1 = Semester(semester_number=1, batch_id=batch_2024.id, academic_year="2024-25")
        sem2 = Semester(semester_number=2, batch_id=batch_2024.id, academic_year="2024-25")
        sem3 = Semester(semester_number=1, batch_id=batch_2023.id, academic_year="2023-24")
        sem4 = Semester(semester_number=2, batch_id=batch_2023.id, academic_year="2023-24")
        db.add_all([sem1, sem2, sem3, sem4])
        db.flush()
        print("✓ Semesters created")
        
        # 3. Create Subjects
        print("Creating subjects...")
        subjects_data = ["Math", "Physics", "Chemistry", "CS", "English"]
        subjects = [Subject(name=name, code=name[:3].upper()) for name in subjects_data]
        db.add_all(subjects)
        db.flush()
        print(f"✓ Subjects created: {subjects_data}")
        
        # 4. Create Students
        print("Creating students...")
        students_data_2024 = [
            {"name": "Raj Kumar", "register_no": "CS2024001", "email": "raj@edu.com", "dob": "03/15/2005"},
            {"name": "Priya Sharma", "register_no": "CS2024002", "email": "priya@edu.com", "dob": "05/22/2005"},
            {"name": "Indumathi", "register_no": "CS2024003", "email": "indumathi@edu.com", "dob": "07/18/2005"},
            {"name": "Vikram Singh", "register_no": "CS2024004", "email": "vikram@edu.com", "dob": "02/10/2005"},
            {"name": "Anjali Verma", "register_no": "CS2024005", "email": "anjali@edu.com", "dob": "08/25/2005"},
        ]

        students_data_2023 = [
            {"name": "Arun Kumar", "register_no": "CS2023001", "email": "arun@edu.com", "dob": "04/10/2004"},
            {"name": "Divya Patel", "register_no": "CS2023002", "email": "divya@edu.com", "dob": "06/20/2004"},
            {"name": "Manoj Singh", "register_no": "CS2023003", "email": "manoj@edu.com", "dob": "09/05/2004"},
            {"name": "Neha Gupta", "register_no": "CS2023004", "email": "neha@edu.com", "dob": "01/12/2004"},
            {"name": "Ravi Patel", "register_no": "CS2023005", "email": "ravi@edu.com", "dob": "11/30/2004"},
        ]
        
        students = []
        # Add 2024 batch students
        for data in students_data_2024:
            dob = datetime.strptime(data["dob"], "%m/%d/%Y").date()
            student = Student(
                name=data["name"],
                register_no=data["register_no"],
                email=data["email"],
                date_of_birth=str(dob),
                batch_id=batch_2024.id
            )
            students.append(student)
            db.add(student)
        
        # Add 2023 batch students
        for data in students_data_2023:
            dob = datetime.strptime(data["dob"], "%m/%d/%Y").date()
            student = Student(
                name=data["name"],
                register_no=data["register_no"],
                email=data["email"],
                date_of_birth=str(dob),
                batch_id=batch_2023.id
            )
            students.append(student)
            db.add(student)
        
        db.flush()
        print(f"✓ Students created: {len(students)} total ({len(students_data_2024)} in 2024, {len(students_data_2023)} in 2023)")
        
        # 5. Create Marks with NEW SPECS: CA total >= 30 for pass, with mixed pass/fail students
        print("Creating marks with mixed pass/fail data...")
        marks_count = 0
        
        # CA Marks for 2024 batch (HIGH performers - all should PASS >= 30)
        ca_data_2024 = [
            # Student 1 (Raj Kumar): All subjects PASS (total CA >= 30)
            {"ca": [[15, 16, 17], [14, 15, 16], [16, 17, 18], [13, 14, 15], [15, 16, 17]], "sem": ["A+", "A", "A+", "B+", "A"]},
            # Student 2 (Priya): All subjects PASS (total CA >= 30)
            {"ca": [[18, 19, 19], [17, 18, 19], [19, 19, 20], [18, 19, 19], [18, 19, 20]], "sem": ["O", "O", "O", "A+", "O"]},
            # Student 3 (Indumathi): All subjects PASS (total CA >= 30)
            {"ca": [[12, 13, 14], [13, 14, 15], [14, 15, 16], [12, 13, 14], [13, 14, 15]], "sem": ["B", "B+", "B", "B", "B+"]},
            # Student 4 (Vikram): All subjects PASS (total CA >= 30)
            {"ca": [[16, 17, 18], [17, 18, 18], [16, 17, 18], [17, 18, 19], [18, 19, 19]], "sem": ["A", "A+", "A", "A+", "A+"]},
            # Student 5 (Anjali): All subjects PASS (total CA >= 30)
            {"ca": [[18, 19, 20], [19, 19, 20], [19, 20, 20], [18, 19, 20], [19, 20, 20]], "sem": ["O", "O", "O", "O", "O"]},
        ]

        # CA Marks for 2023 batch (MIXED: some PASS, some FAIL)
        ca_data_2023 = [
            # Student 1 (Arun): FAILING all subjects (total CA < 30)
            {"ca": [[8, 9, 8], [7, 8, 9], [9, 8, 10], [8, 9, 7], [7, 9, 8]], "sem": ["RA", "RA", "RA", "RA", "RA"]},
            
            # Student 2 (Divya): All subjects PASS (total CA >= 30)
            {"ca": [[15, 16, 17], [16, 17, 17], [16, 17, 18], [15, 16, 17], [16, 17, 18]], "sem": ["A", "A+", "A", "A", "A+"]},
            
            # Student 3 (Manoj): FAILING all subjects (total CA < 30)
            {"ca": [[9, 10, 8], [8, 9, 10], [10, 9, 11], [9, 8, 10], [8, 10, 9]], "sem": ["RA", "C", "RA", "RA", "C"]},
            
            # Student 4 (Neha): MIXED - Some PASS, some FAIL
            {"ca": [[14, 15, 11], [13, 14, 12], [15, 16, 14], [12, 13, 10], [15, 16, 14]], "sem": ["B+", "B", "B+", "C", "B+"]},
            
            # Student 5 (Ravi): MIXED - Some PASS, some FAIL  
            {"ca": [[10, 12, 9], [11, 13, 10], [14, 15, 12], [13, 14, 11], [12, 14, 11]], "sem": ["C", "B", "B", "B", "B"]},
        ]
        
        # Create marks for 2024 batch (first 5 students - all HIGH performers)
        for student_idx, data in enumerate(ca_data_2024):
            ca_marks = data["ca"]
            sem_grades = data["sem"]
            for subject_idx, ca_list in enumerate(ca_marks):
                mark_obj = Mark(
                    student_id=students[student_idx].id,
                    subject_id=subjects[subject_idx].id,
                    semester_id=sem1.id,
                    ca1=float(ca_list[0]),
                    ca2=float(ca_list[1]),
                    ca3=float(ca_list[2]),
                    semester_marks=None,  # Not entered yet
                    sem_grade=sem_grades[subject_idx],  # Set SEM grade
                    sem_published=False  # NOT published - no semester marks
                )
                db.add(mark_obj)
                marks_count += 1

        # Create marks for 2023 batch (next 5 students - MIXED: some pass, some fail)
        for student_idx, data in enumerate(ca_data_2023):
            ca_marks = data["ca"]
            sem_grades = data["sem"]
            for subject_idx, ca_list in enumerate(ca_marks):
                mark_obj = Mark(
                    student_id=students[len(students_data_2024) + student_idx].id,  # Offset to 2023 students
                    subject_id=subjects[subject_idx].id,
                    semester_id=sem3.id,  # Use 2023 batch semester
                    ca1=float(ca_list[0]),
                    ca2=float(ca_list[1]),
                    ca3=float(ca_list[2]),
                    semester_marks=None,  # Not entered yet
                    sem_grade=sem_grades[subject_idx],  # Set SEM grade
                    sem_published=False  # NOT published - no semester marks
                )
                db.add(mark_obj)
                marks_count += 1
        
        db.flush()
        print(f"✓ Marks created: {marks_count}")
        
        # Print summary
        print("\n📊 Data Summary:")
        print("=" * 60)
        print("2024 Batch (All PASS >= 30):")
        for data in ca_data_2024:
            totals = [(s[0]+s[1]+s[2]) for s in data["ca"]]
            print(f"  Subject Totals: {totals} -> All >= 30 ✅")
        
        print("\n2023 Batch (MIXED Pass/Fail):")
        for idx, data in enumerate(ca_data_2023):
            totals = [(s[0]+s[1]+s[2]) for s in data["ca"]]
            passed = sum(1 for t in totals if t >= 30)
            failed = len(totals) - passed
            print(f"  Student {idx+1} Totals: {totals} -> {passed} Pass, {failed} Fail")
        
        db.commit()
        print("\n✅ Database populated successfully!")
        print(f"   - Batches: 2 (2024 HIGH performers, 2023 MIXED)")
        print(f"   - Semesters: 2")
        print(f"   - Subjects: {len(subjects)}")
        print(f"   - Students: {len(students)}")
        print(f"   - Marks: {marks_count}")
        print(f"   - Pass Criteria: CA total >= 30 per subject")
        print(f"   - SEM Published: FALSE (no semester marks entered)")
        
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    populate_data()
