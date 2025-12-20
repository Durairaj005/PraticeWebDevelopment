#!/usr/bin/env python3
"""
Migration script to add SEM Grade and SEM Published columns to marks table
This script adds new columns to support semester grades while maintaining backward compatibility
"""

import sys
sys.path.insert(0, '.')

import sqlite3
from pathlib import Path

def migrate_database():
    """Add SEM grade columns to marks table"""
    db_path = Path('eduanalytics.db')
    
    if not db_path.exists():
        print("❌ Database not found. Run init_database.py first.")
        return False
    
    try:
        conn = sqlite3.connect('eduanalytics.db')
        cursor = conn.cursor()
        
        print("Starting migration...")
        print("=" * 50)
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(marks)")
        columns = {col[1] for col in cursor.fetchall()}
        
        print(f"\nCurrent columns in 'marks' table:")
        for col in sorted(columns):
            print(f"  ✓ {col}")
        
        # Add sem_grade column if it doesn't exist
        if 'sem_grade' not in columns:
            print("\n→ Adding sem_grade column...")
            cursor.execute('ALTER TABLE marks ADD COLUMN sem_grade VARCHAR(2) DEFAULT NULL')
            print("  ✅ sem_grade column added")
        else:
            print("\n  ✓ sem_grade column already exists")
        
        # Add sem_published column if it doesn't exist
        if 'sem_published' not in columns:
            print("→ Adding sem_published column...")
            cursor.execute('ALTER TABLE marks ADD COLUMN sem_published BOOLEAN DEFAULT 0')
            print("  ✅ sem_published column added")
        else:
            print("\n  ✓ sem_published column already exists")
        
        conn.commit()
        
        # Verify migration
        print("\n" + "=" * 50)
        print("Verifying migration...")
        cursor.execute("PRAGMA table_info(marks)")
        updated_columns = {col[1] for col in cursor.fetchall()}
        
        print(f"\nUpdated columns in 'marks' table:")
        for col in sorted(updated_columns):
            print(f"  ✓ {col}")
        
        # Check if migration was successful
        if 'sem_grade' in updated_columns and 'sem_published' in updated_columns:
            print("\n" + "=" * 50)
            print("✅ Migration successful!")
            print("\nNew columns:")
            print("  • sem_grade (VARCHAR): O, A+, A, B+, B, C, RA")
            print("  • sem_published (BOOLEAN): Flag for semester results availability")
            return True
        else:
            print("\n❌ Migration verification failed!")
            return False
            
    except sqlite3.OperationalError as e:
        print(f"\n❌ Database error: {str(e)}")
        return False
    finally:
        conn.close()


if __name__ == "__main__":
    success = migrate_database()
    sys.exit(0 if success else 1)
