"""
Fix database schema - Add missing columns to marks table
This script adds the missing semester_marks, sem_grade, and sem_published columns
"""
import sqlite3
import os

db_path = 'eduanalytics.db'

def fix_database_schema():
    """Add missing columns to marks table"""
    
    if not os.path.exists(db_path):
        print("❌ Database not found. Run create_db.py first.")
        return False
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check existing columns
        cursor.execute("PRAGMA table_info(marks)")
        existing_columns = {col[1] for col in cursor.fetchall()}
        print(f"Existing columns in marks table: {existing_columns}")
        
        # Add missing columns
        missing_columns = [
            ('semester_marks', 'FLOAT', False),
            ('sem_grade', 'VARCHAR(2)', True),
            ('sem_published', 'BOOLEAN', 'DEFAULT 0')
        ]
        
        for col_name, col_type, default_val in missing_columns:
            if col_name not in existing_columns:
                if default_val is False:
                    alter_sql = f"ALTER TABLE marks ADD COLUMN {col_name} {col_type}"
                else:
                    alter_sql = f"ALTER TABLE marks ADD COLUMN {col_name} {col_type} {default_val}"
                
                cursor.execute(alter_sql)
                print(f"✅ Added column: {col_name}")
            else:
                print(f"⏭️  Column already exists: {col_name}")
        
        conn.commit()
        print("\n✅ Database schema fixed successfully!")
        return True
        
    except sqlite3.OperationalError as e:
        print(f"❌ Error: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == '__main__':
    fix_database_schema()
