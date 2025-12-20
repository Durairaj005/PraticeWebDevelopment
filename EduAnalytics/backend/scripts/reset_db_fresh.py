import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

# Import database setup
from app.database import engine, Base
from app.models import *
from sqlalchemy import inspect

print("🔄 Resetting database...")

# Drop all tables
Base.metadata.drop_all(bind=engine)
print("✓ Tables dropped")

# Recreate all tables
Base.metadata.create_all(bind=engine)
print("✓ Tables recreated")

# Initialize with fresh data
from app.main import init_data
init_data()
print("✓ Fresh data initialized")

print("\n✅ Database reset complete!")
print("📊 Backend is ready. You can now upload the updated CSV file.")
