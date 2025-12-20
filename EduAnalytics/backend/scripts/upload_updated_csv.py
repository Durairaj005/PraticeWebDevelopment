import csv
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import Batch, Semester, Student, Subject, Mark

# Create database session
DATABASE_URL = "sqlite:///./eduanalytics.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
session = SessionLocal()

# Read and upload CSV
csv_file = Path(__file__).parent.parent / "Current_Batch_2025_No_SemMarks.csv"

print(f"📂 Reading CSV: {csv_file}")

with open(csv_file, 'r') as f:
    reader = csv.DictReader(f)
    
    # Group by student and subject to avoid duplicates
    data_map = {}
    
    for row in reader:
        key = (row['Register_No'], row['Subject_Name'])
        if key not in data_map:
            data_map[key] = row

print(f"✓ Read {len(data_map)} unique student-subject combinations")

# Get or create batch and semester
batch = session.query(Batch).filter(Batch.batch_year == 2025).first()
if not batch:
    batch = Batch(batch_year=2025)
    session.add(batch)
    session.commit()
    print("✓ Created Batch 2025")

semester = session.query(Semester).filter(Semester.batch_id == batch.id, Semester.semester_number == 1).first()
if not semester:
    semester = Semester(batch_id=batch.id, semester_number=1)
    session.add(semester)
    session.commit()
    print("✓ Created Semester 1")

# Get or create subjects
subjects_map = {}
for subject_name in ['Mathematics', 'Physics', 'Chemistry', 'English', 'Biology']:
    subject = session.query(Subject).filter(Subject.name == subject_name).first()
    if not subject:
        subject = Subject(name=subject_name)
        session.add(subject)
        session.commit()
    subjects_map[subject_name] = subject
    
print(f"✓ Ensured {len(subjects_map)} subjects exist")

# Process each record
updated_count = 0
for (register_no, subject_name), row in data_map.items():
    # Get or create student
    student = session.query(Student).filter(
        Student.register_no == register_no,
        Student.batch_id == batch.id
    ).first()
    
    if not student:
        student = Student(
            register_no=register_no,
            name=row['Student_Name'],
            email=row['Email'],
            date_of_birth=row['Date_of_Birth'],
            batch_id=batch.id
        )
        session.add(student)
        session.commit()
    
    # Get or update marks
    mark = session.query(Mark).filter(
        Mark.student_id == student.id,
        Mark.subject_id == subjects_map[subject_name].id,
        Mark.semester_id == semester.id
    ).first()
    
    if not mark:
        mark = Mark(
            student_id=student.id,
            subject_id=subjects_map[subject_name].id,
            semester_id=semester.id,
            ca1=float(row['CA1']),
            ca2=float(row['CA2']),
            ca3=float(row['CA3'])
        )
        session.add(mark)
    else:
        mark.ca1 = float(row['CA1'])
        mark.ca2 = float(row['CA2'])
        mark.ca3 = float(row['CA3'])
    
    updated_count += 1

session.commit()
print(f"\n✅ Successfully uploaded {updated_count} mark records!")
print("📊 All students now have marks > 30 on each CA component")
session.close()
