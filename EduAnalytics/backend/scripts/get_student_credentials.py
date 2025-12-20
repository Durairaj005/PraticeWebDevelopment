import sqlite3

conn = sqlite3.connect('eduanalytics.db')
cur = conn.cursor()

print("=" * 60)
print("STUDENT CREDENTIALS FOR LOGIN")
print("=" * 60)

# Get students with their DOB
cur.execute('SELECT register_no, name, date_of_birth, batch_id FROM students ORDER BY register_no')
students = cur.fetchall()

print(f"\nTotal Students in Database: {len(students)}\n")

for row in students:
    reg_no = row[0]
    name = row[1]
    dob = row[2]
    batch = row[3]
    print(f"Register No: {reg_no}")
    print(f"Name: {name}")
    print(f"DOB (Password): {dob}")
    print(f"Batch: {batch}")
    print("-" * 60)

# Check data counts
cur.execute('SELECT COUNT(*) FROM marks')
total_marks = cur.fetchone()[0]
print(f"\nTotal Marks Records: {total_marks}")

conn.close()
