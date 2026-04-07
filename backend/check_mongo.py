from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/academic_behavior_db")

print(f"Connecting to: {MONGO_URI}")
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    # The ismaster command is cheap and does not require auth.
    client.admin.command('ismaster')
    print("MongoDB is UP")
    db = client.get_default_database()
    print(f"Connected to database: {db.name}")
    print(f"Collections: {db.list_collection_names()}")
except Exception as e:
    print(f"MongoDB is DOWN or unreachable: {e}")
