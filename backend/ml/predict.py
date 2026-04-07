import joblib
import os
import numpy as np

_model = None
_model_path = os.path.join(os.path.dirname(__file__), "model.pkl")

def _load_model():
    global _model
    if _model is None:
        if os.path.exists(_model_path):
            _model = joblib.load(_model_path)
        else:
            # Fallback: rule-based prediction if model not trained yet
            _model = "rule_based"
    return _model

def predict_behavior(attendance, internal_marks, exam_marks, test_score):
    """
    Predicts academic behavior: Weak / Medium / Excellent
    Inputs are numeric (0-100 scale).
    """
    model = _load_model()

    if model == "rule_based":
        # Simple rule-based fallback
        composite = (
            0.30 * float(attendance) +
            0.25 * float(internal_marks) +
            0.25 * float(exam_marks) +
            0.20 * float(test_score)
        )
        if composite < 45:
            return "Weak"
        elif composite < 70:
            return "Medium"
        else:
            return "Excellent"

    features = np.array([[float(attendance), float(internal_marks),
                          float(exam_marks), float(test_score)]])
    prediction = model.predict(features)
    return prediction[0]
