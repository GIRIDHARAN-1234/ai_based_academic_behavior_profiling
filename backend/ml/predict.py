import os

def predict_behavior(attendance, internal_marks, exam_marks, test_score=0):
    """
    Classifies student academic behavior based on avg_score.

    avg_score = (internal_marks + exam_marks) / 2

    Classification:
        >= 85  → Excellent
        >= 70  → Good
        >= 50  → Average
        >= 35  → Below Average
        <  35  → At Risk
    """
    internal = float(internal_marks)
    exam     = float(exam_marks)

    avg_score = (internal + exam) / 2

    if avg_score >= 85:
        return "Excellent"
    elif avg_score >= 70:
        return "Good"
    elif avg_score >= 50:
        return "Average"
    elif avg_score >= 35:
        return "Below Average"
    else:
        return "At Risk"
