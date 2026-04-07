from pymongo import MongoClient
from config import MONGO_URI

client = MongoClient(MONGO_URI)
db = client.get_default_database()

print("Users in database:")
for user in db.users.find():
    # Don't print password hash
    u = user.copy()
    u.pop('password', None)
    print(u)
