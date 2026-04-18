from flask import Blueprint, request, jsonify, current_app
from middleware.auth_middleware import require_role
from bson import ObjectId
from datetime import datetime
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from ml.predict import predict_behavior

admin_bp = Blueprint("admin", __name__)

def get_db():
    return current_app.db

def get_weighted_avg(db, student_id):
    """Weighted average of all past test scores (newest = highest weight)."""
    results = list(db.results.find({"student_id": student_id}).sort("submitted_at", 1))
    if not results:
        return 0
    n = len(results)
    total_w = n * (n + 1) / 2
    return round(sum((i + 1) * r["score"] for i, r in enumerate(results)) / total_w, 1)

@admin_bp.route("/users", methods=["GET"])
@require_role("admin")
def get_users():
    db = get_db()
    role = request.args.get("role")
    query = {} if not role else {"role": role}
    users = list(db.users.find(query))
    for u in users:
        u["_id"] = str(u["_id"])
        u.pop("password", None)
    return jsonify(users)

@admin_bp.route("/users/<user_id>/status", methods=["PUT"])
@require_role("admin")
def update_user_status(user_id):
    db = get_db()
    data = request.get_json()
    status = data.get("status")
    if status not in ["active", "inactive", "pending"]:
        return jsonify({"error": "Invalid status"}), 400
    result = db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"status": status}})
    if result.matched_count == 0:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"message": f"User status updated to {status}"})

@admin_bp.route("/users/<user_id>", methods=["DELETE"])
@require_role("admin")
def delete_user(user_id):
    db = get_db()
    result = db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"message": "User deleted"})

@admin_bp.route("/analytics", methods=["GET"])
@require_role("admin")
def get_analytics():
    db = get_db()
    total_students = db.users.count_documents({"role": "student", "status": "active"})
    total_faculty  = db.users.count_documents({"role": "faculty", "status": "active"})
    pending_faculty = db.users.count_documents({"role": "faculty", "status": "pending"})
    total_tests    = db.tests.count_documents({})
    total_results  = db.results.count_documents({})

    # Behavior distribution using WEIGHTED avg scores
    students = list(db.users.find({"role": "student", "status": "active"}))
    behavior_counts = {"Excellent": 0, "Good": 0, "Average": 0, "Below Average": 0, "At Risk": 0}
    student_behaviors = []

    at_risk_count = 0
    for s in students:
        sid = str(s["_id"])
        avg_score = round((s.get("internal_marks", 0) + s.get("exam_marks", 0)) / 2, 1)
        behavior = predict_behavior(
            attendance=s.get("attendance", 0),
            internal_marks=s.get("internal_marks", 0),
            exam_marks=s.get("exam_marks", 0)
        )
        behavior_counts[behavior] = behavior_counts.get(behavior, 0) + 1
        tests_taken = db.results.count_documents({"student_id": sid})

        # At-risk: behavior is "At Risk" OR attendance below 75%
        attendance_val = s.get("attendance", 0)
        is_at_risk = behavior == "At Risk" or attendance_val < 75
        if is_at_risk:
            at_risk_count += 1

        student_behaviors.append({
            "name": s["name"],
            "email": s["email"],
            "department": s.get("department", ""),
            "predicted_behavior": behavior,
            "attendance": attendance_val,
            "internal_marks": s.get("internal_marks", 0),
            "exam_marks": s.get("exam_marks", 0),
            "avg_score": avg_score,
            "avg_test_score": get_weighted_avg(db, sid),
            "tests_taken": tests_taken,
            "at_risk": is_at_risk
        })

    at_risk_pct = round((at_risk_count / total_students * 100), 1) if total_students > 0 else 0

    # Faculty with their test counts
    faculty_list = list(db.users.find({"role": "faculty"}))
    faculty_data = []
    for f in faculty_list:
        fid = str(f["_id"])
        test_count = db.tests.count_documents({"faculty_id": fid})
        faculty_data.append({
            "_id": fid,
            "name": f["name"],
            "email": f["email"],
            "status": f.get("status", "pending"),
            "tests_created": test_count
        })

    return jsonify({
        "totals": {
            "students": total_students,
            "faculty": total_faculty,
            "pending_faculty": pending_faculty,
            "tests": total_tests,
            "submissions": total_results,
            "at_risk_count": at_risk_count,
            "at_risk_percentage": at_risk_pct
        },
        "behavior_distribution": behavior_counts,
        "student_behaviors": student_behaviors,
        "faculty": faculty_data
    })
