"""
Train the academic behavior prediction model.
Run this script once to generate model.pkl before starting the Flask server.
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import os

np.random.seed(42)
N = 800

# Generate synthetic dataset
attendance = np.random.randint(30, 100, N)
internal_marks = np.random.randint(20, 100, N)
exam_marks = np.random.randint(20, 100, N)
test_score = np.random.randint(0, 100, N)

# Compute composite score with weighted formula
composite = (
    0.30 * attendance +
    0.25 * internal_marks +
    0.25 * exam_marks +
    0.20 * test_score
)

# Label rules
def label(c):
    if c < 45:
        return "Weak"
    elif c < 70:
        return "Medium"
    else:
        return "Excellent"

labels = np.array([label(c) for c in composite])

df = pd.DataFrame({
    "attendance": attendance,
    "internal_marks": internal_marks,
    "exam_marks": exam_marks,
    "test_score": test_score,
    "behavior": labels
})

X = df[["attendance", "internal_marks", "exam_marks", "test_score"]]
y = df["behavior"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

print("=== Model Training Report ===")
print(classification_report(y_test, model.predict(X_test)))

model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
joblib.dump(model, model_path)
print(f"[OK] Model saved to: {model_path}")
