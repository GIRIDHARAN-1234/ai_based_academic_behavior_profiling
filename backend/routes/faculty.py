from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import get_jwt_identity, get_jwt
from middleware.auth_middleware import require_role
from bson import ObjectId
from datetime import datetime
import sys, os, bcrypt
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from ml.predict import predict_behavior

faculty_bp = Blueprint("faculty", __name__)

def get_db():
    return current_app.db

def get_avg_test_score(db, student_id):
    """Get weighted average of all past test scores for a student.
       Most recent tests carry slightly more weight.
    """
    all_results = list(db.results.find({"student_id": student_id}).sort("submitted_at", 1))
    if not all_results:
        return 0
    n = len(all_results)
    # Linear weighting: latest result gets weight n, oldest gets weight 1
    total_weight = sum(range(1, n + 1))  # n*(n+1)/2
    weighted_sum = sum((i + 1) * r["score"] for i, r in enumerate(all_results))
    return round(weighted_sum / total_weight, 2)

def build_student_analytics(db, s):
    """Build analytics dict for one student using ALL past scores."""
    sid = str(s["_id"])
    avg_score = get_avg_test_score(db, sid)
    last_result = db.results.find_one({"student_id": sid}, sort=[("submitted_at", -1)])
    last_score = last_result["score"] if last_result else 0
    tests_taken = db.results.count_documents({"student_id": sid})

    behavior = predict_behavior(
        attendance=s.get("attendance", 0),
        internal_marks=s.get("internal_marks", 0),
        exam_marks=s.get("exam_marks", 0),
        test_score=avg_score
    )
    return {
        "_id": sid,
        "name": s["name"],
        "email": s["email"],
        "department": s.get("department", ""),
        "attendance": s.get("attendance", 0),
        "internal_marks": s.get("internal_marks", 0),
        "exam_marks": s.get("exam_marks", 0),
        "last_test_score": last_score,
        "avg_test_score": avg_score,
        "tests_taken": tests_taken,
        "predicted_behavior": behavior
    }

# ─── CREATE STUDENT (by faculty) ─────────────────────────────────────────────

@faculty_bp.route("/create-student", methods=["POST"])
@require_role("faculty")
def create_student():
    db = get_db()
    faculty_id = get_jwt_identity()
    data = request.get_json()

    required = ["name", "email", "attendance", "internal_marks", "exam_marks"]
    if not all(k in data for k in required):
        return jsonify({"error": "name, email, attendance, internal_marks and exam_marks are required"}), 400

    if db.users.find_one({"email": data["email"]}):
        return jsonify({"error": f"Email {data['email']} is already registered"}), 409

    # Default password = student123 (faculty informs student verbally or via email)
    default_password = data.get("password", "student123")
    hashed_pw = bcrypt.hashpw(default_password.encode(), bcrypt.gensalt()).decode()

    student = {
        "name": data["name"],
        "email": data["email"],
        "password": hashed_pw,
        "role": "student",
        "department": data.get("department", ""),
        "status": "active",
        "attendance": float(data["attendance"]),
        "internal_marks": float(data["internal_marks"]),
        "exam_marks": float(data["exam_marks"]),
        "last_test_score": 0,
        "created_by_faculty": faculty_id,
        "created_at": datetime.utcnow()
    }
    result = db.users.insert_one(student)
    return jsonify({
        "message": f"Student {data['name']} created successfully. They can login with their email and password: {default_password}",
        "id": str(result.inserted_id),
        "default_password": default_password
    }), 201

@faculty_bp.route("/create-student-bulk", methods=["POST"])
@require_role("faculty")
def create_student_bulk():
    """Create multiple students at once from a list."""
    db = get_db()
    faculty_id = get_jwt_identity()
    data = request.get_json()
    students_data = data.get("students", [])

    created = []
    errors = []
    for s in students_data:
        if not all(k in s for k in ["name", "email", "attendance", "internal_marks", "exam_marks"]):
            errors.append(f"Missing fields for: {s.get('email','unknown')}")
            continue
        if db.users.find_one({"email": s["email"]}):
            errors.append(f"Already exists: {s['email']}")
            continue
        hashed_pw = bcrypt.hashpw(b"student123", bcrypt.gensalt()).decode()
        db.users.insert_one({
            "name": s["name"], "email": s["email"],
            "password": hashed_pw, "role": "student",
            "department": s.get("department", ""), "status": "active",
            "attendance": float(s["attendance"]),
            "internal_marks": float(s["internal_marks"]),
            "exam_marks": float(s["exam_marks"]),
            "last_test_score": 0,
            "created_by_faculty": faculty_id,
            "created_at": datetime.utcnow()
        })
        created.append(s["email"])

    return jsonify({
        "created": len(created),
        "errors": errors,
        "message": f"Created {len(created)} students. Default password: student123"
    }), 201

# ─── GET STUDENTS ─────────────────────────────────────────────────────────────

@faculty_bp.route("/students", methods=["GET"])
@require_role("faculty")
def get_students():
    db = get_db()
    students = list(db.users.find({"role": "student", "status": "active"}))
    return jsonify([build_student_analytics(db, s) for s in students])

# ─── TESTS ────────────────────────────────────────────────────────────────────

@faculty_bp.route("/tests", methods=["POST"])
@require_role("faculty")
def create_test():
    db = get_db()
    faculty_id = get_jwt_identity()
    claims = get_jwt()
    data = request.get_json()

    required = ["title", "questions"]
    if not all(k in data for k in required):
        return jsonify({"error": "title and questions are required"}), 400

    test = {
        "title": data["title"],
        "description": data.get("description", ""),
        "questions": data["questions"],
        "faculty_id": faculty_id,
        "faculty_name": claims.get("name", ""),
        "deadline": datetime.fromisoformat(data.get("deadline", "2099-12-31T23:59:59")),
        "assigned_to": [],
        "created_at": datetime.utcnow()
    }
    result = db.tests.insert_one(test)
    return jsonify({"message": "Test created successfully", "id": str(result.inserted_id)}), 201

@faculty_bp.route("/tests", methods=["GET"])
@require_role("faculty")
def get_tests():
    db = get_db()
    faculty_id = get_jwt_identity()
    tests = list(db.tests.find({"faculty_id": faculty_id}))
    for t in tests:
        t["_id"] = str(t["_id"])
        t["deadline"] = t["deadline"].isoformat()
        t["created_at"] = t["created_at"].isoformat()
        t["assigned_count"] = len(t.get("assigned_to", []))
    return jsonify(tests)

@faculty_bp.route("/tests/<test_id>/assign", methods=["POST"])
@require_role("faculty")
def assign_test(test_id):
    db = get_db()
    data = request.get_json()
    emails = data.get("emails", [])
    deadline_str = data.get("deadline")

    if not emails:
        return jsonify({"error": "No student emails provided"}), 400

    update = {"$addToSet": {"assigned_to": {"$each": emails}}}
    if deadline_str:
        update["$set"] = {"deadline": datetime.fromisoformat(deadline_str)}

    result = db.tests.update_one({"_id": ObjectId(test_id)}, update)
    if result.matched_count == 0:
        return jsonify({"error": "Test not found"}), 404

    for email in emails:
        student = db.users.find_one({"email": email, "role": "student"})
        if student:
            avg_score = get_avg_test_score(db, str(student["_id"]))
            behavior = predict_behavior(
                attendance=student.get("attendance", 0),
                internal_marks=student.get("internal_marks", 0),
                exam_marks=student.get("exam_marks", 0),
                test_score=avg_score
            )
            update_fields = {"predicted_behavior": behavior}
            if behavior == "Weak":
                update_fields["early_warning"] = True
            db.users.update_one({"email": email}, {"$set": update_fields})

    return jsonify({"message": f"Test assigned to {len(emails)} student(s)"})

# ─── ANALYTICS ────────────────────────────────────────────────────────────────

@faculty_bp.route("/analytics", methods=["GET"])
@require_role("faculty")
def get_analytics():
    db = get_db()
    faculty_id = get_jwt_identity()
    students = list(db.users.find({"role": "student", "status": "active"}))

    analytics = []
    behavior_counts = {"Weak": 0, "Medium": 0, "Excellent": 0}
    warnings = []

    for s in students:
        entry = build_student_analytics(db, s)
        analytics.append(entry)
        b = entry["predicted_behavior"]
        behavior_counts[b] = behavior_counts.get(b, 0) + 1
        if b == "Weak":
            warnings.append({"name": s["name"], "email": s["email"]})

    return jsonify({
        "students": analytics,
        "behavior_distribution": behavior_counts,
        "early_warnings": warnings,
        "total_tests": db.tests.count_documents({"faculty_id": faculty_id})
    })
