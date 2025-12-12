from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import certifi
import asyncio

mongo_client = None
db = None

async def connect_to_mongo():
    global mongo_client, db
    max_retries = 3
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            print(f"🔄 Connecting to MongoDB Atlas (attempt {attempt + 1}/{max_retries})...")
            mongo_client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                tlsCAFile=certifi.where(),
                serverSelectionTimeoutMS=10000,
                connectTimeoutMS=10000
            )
            db = mongo_client[settings.DATABASE_NAME]
            await mongo_client.admin.command('ping')
            print("✅ MongoDB Atlas connected!")
            return
        except Exception as error:
            print(f"⚠️ MongoDB connection attempt {attempt + 1} failed: {str(error)[:100]}")
            if attempt < max_retries - 1:
                print(f"⏳ Retrying in {retry_delay} seconds...")
                await asyncio.sleep(retry_delay)
            else:
                print("❌ Failed to connect to MongoDB after 3 attempts")
                print("💡 Tip: Check your internet connection or try:")
                print("   1. Use mobile hotspot")
                print("   2. Disable VPN/Firewall")
                print("   3. Check MongoDB Atlas IP whitelist")
                raise error

async def close_mongo_connection():
    global mongo_client
    if mongo_client:
        mongo_client.close()
        print("MongoDB connection closed")

def get_database():
    return db
