# AI-Based Academic Behavior Profiling System

## Overview
A full-stack web application that analyzes student academic performance and predicts their behavior (Weak / Medium / Excellent) using Machine Learning.

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) + Chart.js |
| Backend | Python Flask + JWT |
| Database | MongoDB |
| ML Model | Random Forest (scikit-learn, 89% accuracy) |

## User Roles
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@academic.com | admin123 |
| Faculty | Register → Admin activates | — |
| Student | Register (auto-active) | — |

## Project Structure
```
/backend      — Flask REST API (port 5000)
  /routes     — auth, student, faculty, admin, predict
  /middleware — JWT role-check decorators
  /ml         — Random Forest model training & prediction
  /models     — MongoDB collection helpers

/frontend     — React + Vite (port 5173)
  /src/pages  — Student, Faculty, Admin dashboards
  /src/api    — Axios service layer
  /src/context— AuthContext (JWT state)
```

## Setup & Run

### 1. Prerequisites
- Python 3.10+ and pip
- Node.js 18+ and npm
- MongoDB running locally on port 27017

### 2. Backend
```bash
cd "e:/ANTIGRAVITY PROJECT AI BASED/backend"

# Install dependencies
pip install -r requirements.txt

# Train ML model (run once)
python ml/train_model.py

# Start server
python app.py
```
Backend runs at: **http://localhost:5000**

### 3. Frontend
```bash
cd "e:/ANTIGRAVITY PROJECT AI BASED/frontend"

# Install packages
npm install

# Start dev server
npm run dev
```
Frontend runs at: **http://localhost:5173**

## Feature Summary

### Student
- View/update profile (attendance, marks)
- Attend MCQ tests online
- See AI behavior prediction (Weak/Medium/Excellent)
- Performance trend line chart
- Test results history

### Faculty
- Create MCQ tests with options & correct answers
- Assign tests to students by email
- View student analytics table + behavior prediction
- Early Warning System for at-risk students
- Bar chart + donut chart visualizations

### Admin
- Activate/deactivate/delete users
- View system-wide analytics (totals, distribution)
- Behavior monitoring across all students
- Faculty performance overview

## ML Model Details
- **Algorithm**: Random Forest Classifier (100 estimators)
- **Features**: Attendance%, Internal Marks, Exam Marks, MCQ Test Score
- **Classes**: Weak | Medium | Excellent
- **Training Accuracy**: ~89% on 800 synthetic samples
- **Saved artifact**: `backend/ml/model.pkl`

## Environment Variables (optional)
Create `backend/.env`:
```
MONGO_URI=mongodb://localhost:27017/academic_behavior_db
JWT_SECRET_KEY=your_secret_key_here
DEBUG=True
PORT=5000
```
