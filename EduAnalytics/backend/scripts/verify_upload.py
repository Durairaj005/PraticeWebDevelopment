import sqlite3

# Read the CSV file
csv_file = "Current_Batch_2025_No_SemMarks.csv"

with open(csv_file, 'r') as f:
    lines = f.readlines()
    print(f"CSV File: {csv_file}")
    print(f"Total lines (including header): {len(lines)}")
    print(f"Data rows (excluding header): {len(lines) - 1}")
    print("\nFirst 5 lines:")
    for i, line in enumerate(lines[:5]):
        print(f"{i}: {line.strip()[:80]}")

# Check database
print("\n" + "="*60)
print("CURRENT DATABASE STATE")
print("="*60)

conn = sqlite3.connect('eduanalytics.db')
cur = conn.cursor()

# Get all students
cur.execute('SELECT COUNT(*) FROM students')
total = cur.fetchone()[0]
print(f"\nTotal Students in DB: {total}")

cur.execute('''
    SELECT s.register_no, s.name, b.batch_year, COUNT(m.id) as marks_count
    FROM students s
    LEFT JOIN batches b ON s.batch_id = b.id
    LEFT JOIN marks m ON s.id = m.student_id
    GROUP BY s.id
    ORDER BY b.batch_year DESC, s.register_no
''')

print("\nStudents Details:")
for row in cur.fetchall():
    reg, name, batch, marks = row
    print(f"  {reg:10} | {name:20} | Batch {batch} | {marks} marks")

conn.close()
