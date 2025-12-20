from app.models import Student, Mark, Batch
from app.database import SessionLocal

db = SessionLocal()

# Check batches
batches = db.query(Batch).all()
print("Available batches:")
for b in batches:
    print(f"  - {b.batch_year}")

# Check students
for batch in batches:
    students = db.query(Student).filter(Student.batch_id == batch.id).all()
    print(f"\nBatch {batch.batch_year}: {len(students)} students")
    
    # Check first few students and their marks
    for student in students[:3]:
        marks = db.query(Mark).filter(Mark.student_id == student.id).all()
        print(f"  {student.name} ({student.register_no}): {len(marks)} marks")
        if marks:
            for m in marks[:2]:
                print(f"    - Subject {m.subject_id}: CA1={m.ca1}, CA2={m.ca2}, CA3={m.ca3}, Sem={m.semester_marks}")

db.close()
