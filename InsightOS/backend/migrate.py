import sqlite3

def migrate():
    conn = sqlite3.connect('sql_app.db')
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE complaints ADD COLUMN escalation_status VARCHAR DEFAULT 'none'")
        print("Added escalation_status column.")
    except Exception as e:
        print(f"Error adding escalation_status: {e}")
        
    try:
        cursor.execute("ALTER TABLE complaints ADD COLUMN admin_remarks TEXT")
        print("Added admin_remarks column.")
    except Exception as e:
        print(f"Error adding admin_remarks: {e}")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
