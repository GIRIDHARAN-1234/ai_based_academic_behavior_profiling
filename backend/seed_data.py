"""
Seed the database with demo users and tests so you can test immediately.

Run from the backend folder:
    python seed_data.py

Demo Credentials after seeding:
  Admin:    admin@academic.com   / admin123   (hardcoded in auth.py, no DB needed)
  Faculty:  faculty@academic.com / faculty123
  Student:  arjun@student.com    / student123
  Student:  priya@student.com    / student123
  Student:  rahul@student.com    / student123
"""

import platform as _platform
_orig_win32_ver = _platform.win32_ver
def _safe_win32_ver(release='', version='', csd='', ptype=''):
    try:
        return _orig_win32_ver(release, version, csd, ptype)
    except OSError:
        return (release or 'Win10', version or '10.0.0', csd, ptype)
_platform.win32_ver = _safe_win32_ver

from pymongo import MongoClient
import bcrypt
from datetime import datetime, timedelta
import sys, os

sys.path.insert(0, os.path.dirname(__file__))
from config import MONGO_URI

client = MongoClient(MONGO_URI)
db = client.get_default_database()

def hash_pw(pw):
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

# ── Clear existing demo data ──────────────────────────────────────────────────
demo_emails = [
    "faculty@academic.com",
    "arjun@student.com", "priya@student.com", "rahul@student.com",
    "deepika@student.com", "surya@student.com"
]
db.users.delete_many({"email": {"$in": demo_emails}})
db.tests.delete_many({"faculty_name": "Demo Faculty"})
print("[INFO] Cleared existing demo data.")

# ── Faculty ────────────────────────────────────────────────────────────────────
faculty = db.users.insert_one({
    "name": "Dr. Meera Nair",
    "email": "faculty@academic.com",
    "password": hash_pw("faculty123"),
    "role": "faculty",
    "department": "Computer Science",
    "status": "active",
    "created_at": datetime.utcnow()
})
faculty_id = str(faculty.inserted_id)
print(f"[OK] Faculty created: faculty@academic.com / faculty123")

# ── Students ──────────────────────────────────────────────────────────────────
students_data = [
    {"name":"Arjun Kumar",    "email":"arjun@student.com",  "dept":"CSE", "att":88, "im":78, "em":82},
    {"name":"Priya Sharma",   "email":"priya@student.com",  "dept":"CSE", "att":55, "im":45, "em":50},
    {"name":"Rahul Verma",    "email":"rahul@student.com",  "dept":"ECE", "att":72, "im":65, "em":70},
    {"name":"Deepika Singh",  "email":"deepika@student.com","dept":"ECE", "att":91, "im":88, "em":85},
    {"name":"Surya Prakash",  "email":"surya@student.com",  "dept":"MECH","att":42, "im":38, "em":45},
]

student_ids = {}
for s in students_data:
    result = db.users.insert_one({
        "name": s["name"],
        "email": s["email"],
        "password": hash_pw("student123"),
        "role": "student",
        "department": s["dept"],
        "status": "active",
        "attendance": s["att"],
        "internal_marks": s["im"],
        "exam_marks": s["em"],
        "last_test_score": 0,
        "created_by_faculty": faculty_id,
        "created_at": datetime.utcnow()
    })
    student_ids[s["email"]] = str(result.inserted_id)
    print(f"[OK] Student created: {s['email']} / student123")

# ── MCQ Test ──────────────────────────────────────────────────────────────────
test = db.tests.insert_one({
    "title": "Python Fundamentals - Demo Test",
    "description": "A sample Python MCQ test on basics of the language.",
    "questions": [
        {"text":"What is the output of print(2 ** 3)?", "options":["6","8","9","4"], "correct":"B"},
        {"text":"Which keyword defines a function in Python?", "options":["func","def","function","lambda"], "correct":"B"},
        {"text":"What data type is [1, 2, 3]?", "options":["Tuple","Dictionary","List","Set"], "correct":"C"},
        {"text":"What does len('hello') return?", "options":["4","5","6","None"], "correct":"B"},
        {"text":"Which is NOT a Python data type?", "options":["int","float","char","str"], "correct":"C"},
        {"text":"What is the output of bool(0)?", "options":["True","False","None","Error"], "correct":"B"},
        {"text":"Which operator is used for floor division?", "options":["/","//","%","**"], "correct":"B"},
        {"text":"What method adds an item to a list?", "options":["add()","push()","append()","insert_at()"], "correct":"C"},
    ],
    "faculty_id": faculty_id,
    "faculty_name": "Demo Faculty",
    "deadline": datetime.utcnow() + timedelta(days=30),
    "assigned_to": list(student_ids.keys()),
    "created_at": datetime.utcnow()
})
print(f"[OK] Demo MCQ test created and assigned to all students.")

# ── Simulate some past results ─────────────────────────────────────────────────
# Give Arjun two past scores so weighted avg shows
arjun_id = student_ids.get("arjun@student.com")
if arjun_id:
    db.results.delete_many({"student_id": arjun_id})
# (leave results empty so students can take the live test as demo)

print()
print("=" * 52)
print("  Database seeded successfully!")
print("=" * 52)
print()
print("  Login Credentials:")
print("  Admin:   admin@academic.com   / admin123")
print("  Faculty: faculty@academic.com / faculty123")
print("  Student: arjun@student.com    / student123")
print("  Student: priya@student.com    / student123")
print("  Student: rahul@student.com    / student123")
print()
print("  Start the app with:  start.bat")
print("=" * 52)
