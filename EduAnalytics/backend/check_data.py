from app.models import Student, Mark, Batch
from app.database import SessionLocal

db = SessionLocal()

# Check batches
batches = db.query(Batch).all()

# Check students
for batch in batches:
    students = db.query(Student).filter(Student.batch_id == batch.id).all()
    
    # Check first few students and their marks
    for student in students[:3]:
        marks = db.query(Mark).filter(Mark.student_id == student.id).all()
        if marks:
            for m in marks[:2]:
                pass

db.close()
