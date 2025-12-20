import sqlite3

conn = sqlite3.connect('eduanalytics.db')
cur = conn.cursor()
cur.execute('SELECT register_no, name, date_of_birth, length(date_of_birth) FROM students')
print('Register No | Student Name        | DOB           | Len')
print('-' * 70)
for row in cur.fetchall():
    print(f'{row[0]:12}| {row[1]:19} | "{row[2]}"  | {row[3]}')

conn.close()
