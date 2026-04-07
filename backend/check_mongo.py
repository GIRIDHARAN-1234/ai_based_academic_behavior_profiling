from pymongo import MongoClient
from config import MONGO_URI

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
