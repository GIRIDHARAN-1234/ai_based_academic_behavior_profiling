from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import get_jwt_identity
from middleware.auth_middleware import require_role
from bson import ObjectId
from datetime import datetime
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from ml.predict import predict_behavior

student_bp = Blueprint("student", __name__)

def get_db():
    return current_app.db

def serialize_user(u):
    u["_id"] = str(u["_id"])
    u.pop("password", None)
    return u

def get_weighted_avg_score(db, student_id):
    """
    Weighted average of ALL past test scores.
    Most recent tests get higher weight (linear weighting).
    Falls back to 0 if no tests taken.
    """
    all_results = list(db.results.find({"student_id": student_id}).sort("submitted_at", 1))
    if not all_results:
        return 0, []
    n = len(all_results)
    total_weight = n * (n + 1) / 2
    weighted_sum = sum((i + 1) * r["score"] for i, r in enumerate(all_results))
    return round(weighted_sum / total_weight, 2), all_results

def compute_behavior(db, user, student_id=None):
    """Predict behavior using (internal_marks + exam_marks) / 2."""
    return predict_behavior(
        attendance=user.get("attendance", 0),
        internal_marks=user.get("internal_marks", 0),
        exam_marks=user.get("exam_marks", 0)
    )

# ─── PROFILE ─────────────────────────────────────────────────────────────────

@student_bp.route("/profile", methods=["GET"])
@require_role("student")
def get_profile():
    db = get_db()
    uid = get_jwt_identity()
    user = db.users.find_one({"_id": ObjectId(uid)})
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(serialize_user(user))

@student_bp.route("/profile", methods=["PUT"])
@require_role("student")
def update_profile():
    db = get_db()
    uid = get_jwt_identity()
    data = request.get_json()
    allowed = ["attendance", "internal_marks", "exam_marks", "department", "name"]
    update = {k: data[k] for k in allowed if k in data}
    db.users.update_one({"_id": ObjectId(uid)}, {"$set": update})
    user = db.users.find_one({"_id": ObjectId(uid)})
    return jsonify(serialize_user(user))

# ─── TESTS ────────────────────────────────────────────────────────────────────

@student_bp.route("/tests", methods=["GET"])
@require_role("student")
def get_assigned_tests():
    db = get_db()
    uid = get_jwt_identity()
    user = db.users.find_one({"_id": ObjectId(uid)})
    email = user["email"]
    now = datetime.utcnow()
    tests = list(db.tests.find({
        "assigned_to": email,
        "deadline": {"$gte": now}
    }))
    submitted_test_ids = [str(r["test_id"]) for r in db.results.find({"student_id": uid})]
    active_tests = [t for t in tests if str(t["_id"]) not in submitted_test_ids]
    for t in active_tests:
        t["_id"] = str(t["_id"])
        t["deadline"] = t["deadline"].isoformat()
        for q in t.get("questions", []):
            q.pop("correct", None)
    return jsonify(active_tests)

# ─── SUBMIT TEST ──────────────────────────────────────────────────────────────

@student_bp.route("/submit/<test_id>", methods=["POST"])
@require_role("student")
def submit_test(test_id):
    db = get_db()
    uid = get_jwt_identity()
    data = request.get_json()
    answers = data.get("answers", {})

    test = db.tests.find_one({"_id": ObjectId(test_id)})
    if not test:
        return jsonify({"error": "Test not found"}), 404

    if db.results.find_one({"student_id": uid, "test_id": test_id}):
        return jsonify({"error": "Test already submitted"}), 409

    questions = test.get("questions", [])
    correct = sum(1 for i, q in enumerate(questions)
                  if str(i) in answers and answers[str(i)] == q.get("correct"))
    score = round((correct / len(questions)) * 100) if questions else 0

    result_doc = {
        "student_id": uid,
        "test_id": test_id,
        "test_title": test.get("title", ""),
        "score": score,
        "correct": correct,
        "total": len(questions),
        "submitted_at": datetime.utcnow()
    }
    db.results.insert_one(result_doc)

    # ── Predict using (internal + exam) / 2 ──
    user = db.users.find_one({"_id": ObjectId(uid)})
    behavior = compute_behavior(db, user, uid)
    avg_marks = round((user.get("internal_marks", 0) + user.get("exam_marks", 0)) / 2, 1)

    db.users.update_one({"_id": ObjectId(uid)}, {
        "$set": {
            "predicted_behavior": behavior,
            "last_test_score": score,
            "avg_test_score": avg_marks,
            "early_warning": behavior == "At Risk"
        }
    })

    tips = {
        "Excellent":     "🌟 Outstanding performance! Keep it up.",
        "Good":          "👍 Good work! A little more effort will get you to Excellent.",
        "Average":       "📈 You're doing okay. Focus on weak subjects to improve.",
        "Below Average": "⚠️ Below average. Attend classes and revise regularly.",
        "At Risk":       "🚨 Your faculty has been notified. Urgent improvement needed."
    }
    return jsonify({
        "score": score,
        "correct": correct,
        "total": len(questions),
        "avg_score": avg_marks,
        "behavior": behavior,
        "insight": tips.get(behavior, "")
    })

# ─── RESULTS ─────────────────────────────────────────────────────────────────

@student_bp.route("/results", methods=["GET"])
@require_role("student")
def get_results():
    db = get_db()
    uid = get_jwt_identity()
    results = list(db.results.find({"student_id": uid}).sort("submitted_at", -1))
    for r in results:
        r["_id"] = str(r["_id"])
        r["submitted_at"] = r["submitted_at"].isoformat()
    return jsonify(results)

# ─── PREDICTION ───────────────────────────────────────────────────────────────

@student_bp.route("/prediction", methods=["GET"])
@require_role("student")
def get_prediction():
    db = get_db()
    uid = get_jwt_identity()
    user = db.users.find_one({"_id": ObjectId(uid)})

    behavior = compute_behavior(db, user, uid)
    _, all_results = get_weighted_avg_score(db, uid)
    tests_taken = len(all_results)
    avg_marks = round((user.get("internal_marks", 0) + user.get("exam_marks", 0)) / 2, 1)

    db.users.update_one({"_id": ObjectId(uid)}, {
        "$set": {"predicted_behavior": behavior, "avg_test_score": avg_marks}
    })

    tips = {
        "Excellent":     "🌟 Outstanding performance! Keep it up and help peers around you.",
        "Good":          "👍 Good work! Push a bit harder to reach Excellent.",
        "Average":       "📈 You're doing okay. Target above 70 in both internal & exam marks.",
        "Below Average": "⚠️ Below average. Attend classes regularly and revise internal topics.",
        "At Risk":       "🚨 You need urgent improvement. Your faculty has been notified."
    }
    return jsonify({
        "behavior": behavior,
        "insight": tips.get(behavior, ""),
        "tests_taken": tests_taken,
        "data": {
            "attendance": user.get("attendance", 0),
            "internal_marks": user.get("internal_marks", 0),
            "exam_marks": user.get("exam_marks", 0),
            "avg_score": avg_marks,
            "last_test_score": user.get("last_test_score", 0)
        }
    })

# ─── TREND ───────────────────────────────────────────────────────────────────

@student_bp.route("/trend", methods=["GET"])
@require_role("student")
def get_trend():
    db = get_db()
    uid = get_jwt_identity()
    results = list(db.results.find({"student_id": uid}).sort("submitted_at", 1).limit(15))
    trend = [{
        "date": r["submitted_at"].strftime("%b %d"),
        "score": r["score"],
        "title": r.get("test_title", "")
    } for r in results]
    return jsonify(trend)
