#!/usr/bin/env python
"""Test script to check data conditions for fetching"""

from app.db.database import SessionLocal
from app.db.models import Student, Mark, Batch, Subject, Semester

def check_data():
    db = SessionLocal()
    
    print("=" * 60)
    print("DATA FLOW CHECK - Conditions Required for Student Comparison")
    print("=" * 60)
    
    # 1. Check Batches
    batches = db.query(Batch).all()
    print(f"\n1. BATCHES TABLE:")
    print(f"   Total batches: {len(batches)}")
    for b in batches:
        print(f"   - ID: {b.id}, Year: {b.batch_year}")
    
    # 2. Check Students in batch 2024
    students_2024 = db.query(Student).join(Batch).filter(Batch.batch_year == "2024").all()
    print(f"\n2. STUDENTS in BATCH 2024:")
    print(f"   Total students: {len(students_2024)}")
    for s in students_2024[:5]:
        print(f"   - ID: {s.id}, Name: {s.name}, Register: {s.register_no}")
    
    # 3. Check Subjects
    subjects = db.query(Subject).all()
    print(f"\n3. SUBJECTS TABLE:")
    print(f"   Total subjects: {len(subjects)}")
    for subj in subjects:
        print(f"   - ID: {subj.id}, Name: {subj.name}")
    
    # 4. Check Semesters
    semesters = db.query(Semester).all()
    print(f"\n4. SEMESTERS TABLE:")
    print(f"   Total semesters: {len(semesters)}")
    for sem in semesters:
        print(f"   - ID: {sem.id}, Semester: {sem.semester_number}")
    
    # 5. Check Marks data
    marks = db.query(Mark).all()
    print(f"\n5. MARKS TABLE:")
    print(f"   Total marks records: {len(marks)}")
    
    if marks:
        print(f"   Sample marks (first 3):")
        for m in marks[:3]:
            print(f"   - ID: {m.id}")
            print(f"     Student ID: {m.student_id}, Subject ID: {m.subject_id}, Semester ID: {m.semester_id}")
            print(f"     CA1: {m.ca1}, CA2: {m.ca2}, CA3: {m.ca3}, Semester: {m.semester}")
            print(f"     Subject: {m.subject.name if m.subject else 'NULL'}")
            print(f"     Semester Obj: {m.semester_obj.semester_number if m.semester_obj else 'NULL'}")
    else:
        print("   ⚠️  NO MARKS DATA FOUND!")
    
    # 6. Check marks for a specific student
    if students_2024:
        student_id = students_2024[0].id
        student_marks = db.query(Mark).filter(Mark.student_id == student_id).all()
        print(f"\n6. MARKS FOR STUDENT ID {student_id} ({students_2024[0].name}):")
        print(f"   Total marks: {len(student_marks)}")
        for m in student_marks[:3]:
            print(f"   - Subject: {m.subject.name if m.subject else 'NULL'}, CA1: {m.ca1}, Semester: {m.semester}")
    
    print("\n" + "=" * 60)
    print("REQUIREMENTS CHECKLIST:")
    print("=" * 60)
    print(f"✓ Batches exist: {len(batches) > 0}")
    print(f"✓ Batch 2024 has students: {len(students_2024) > 0}")
    print(f"✓ Subjects exist: {len(subjects) > 0}")
    print(f"✓ Semesters exist: {len(semesters) > 0}")
    print(f"✓ Marks exist: {len(marks) > 0}")
    if students_2024:
        student_marks = db.query(Mark).filter(Mark.student_id == students_2024[0].id).all()
        print(f"✓ Student {students_2024[0].id} has marks: {len(student_marks) > 0}")
    
    db.close()

if __name__ == "__main__":
    check_data()
