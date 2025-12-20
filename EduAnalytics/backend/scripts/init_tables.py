"""
Initialize database tables
Run this script to create all tables in the database
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

from app.db.database import init_db

if __name__ == "__main__":
    try:
        print("🔄 Creating database tables...")
        init_db()
        print("✅ All tables created successfully!")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        sys.exit(1)
