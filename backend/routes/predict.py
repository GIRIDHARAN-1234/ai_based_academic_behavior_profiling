from flask import Blueprint, request, jsonify
from flask_jwt_extended import verify_jwt_in_request
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from ml.predict import predict_behavior

predict_bp = Blueprint("predict", __name__)

@predict_bp.route("/predict", methods=["POST"])
def predict():
    try:
        verify_jwt_in_request()
    except Exception:
        pass  # Allow unauthenticated for testing
    data = request.get_json()
    try:
        behavior = predict_behavior(
            attendance=float(data.get("attendance", 0)),
            internal_marks=float(data.get("internal_marks", 0)),
            exam_marks=float(data.get("exam_marks", 0)),
            test_score=float(data.get("test_score", 0))
        )
        return jsonify({"behavior": behavior})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
