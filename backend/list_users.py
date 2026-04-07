from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/academic_behavior_db")

client = MongoClient(MONGO_URI)
db = client.get_default_database()

print("Users in database:")
for user in db.users.find():
    # Don't print password hash
    u = user.copy()
    u.pop('password', None)
    print(u)
