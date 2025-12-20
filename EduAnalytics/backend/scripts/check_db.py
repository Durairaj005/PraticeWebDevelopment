import sqlite3

conn = sqlite3.connect('eduanalytics.db')
cur = conn.cursor()

# Get all tables
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
print('Tables in database:')
for table in cur.fetchall():
    print(f'  - {table[0]}')

# Check students
cur.execute('SELECT COUNT(*) FROM students')
student_count = cur.fetchone()[0]
print(f'\n✓ Total Students: {student_count}')

# Check marks
cur.execute('SELECT COUNT(*) FROM marks')
mark_count = cur.fetchone()[0]
print(f'✓ Total Marks: {mark_count}')

# Get student details
if student_count > 0:
    cur.execute('SELECT register_no, name, batch_id FROM students LIMIT 10')
    print(f'\nStudent Details:')
    for row in cur.fetchall():
        print(f'  - Reg: {row[0]}, Name: {row[1]}, Batch ID: {row[2]}')

# Check batches
cur.execute('SELECT COUNT(*) FROM batches')
batch_count = cur.fetchone()[0]
print(f'\n✓ Total Batches: {batch_count}')

conn.close()
