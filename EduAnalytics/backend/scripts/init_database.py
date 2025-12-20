#!/usr/bin/env python3
"""Initialize the database with all tables"""

import sys
sys.path.insert(0, '.')

from app.db.database import engine
from app.db.models import Base

# Create all tables
print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("✅ Database tables created successfully!")

# Verify tables were created
import sqlite3
conn = sqlite3.connect('eduanalytics.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("\nTables created:")
for table in tables:
    print(f"  - {table[0]}")
conn.close()

print("\n✅ Database initialization complete!")
