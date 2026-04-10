import platform as _platform

# ── Python 3.13 Windows WMI compatibility patch ─────────────────────────────
# pymongo calls platform.system() on import which triggers a WMI query that
# crashes on Python 3.13 / some Windows environments with WinError -2147217358.
# This patch returns safe defaults so pymongo can load without error.
_orig_win32_ver = _platform.win32_ver
def _safe_win32_ver(release='', version='', csd='', ptype=''):
    try:
        return _orig_win32_ver(release, version, csd, ptype)
    except OSError:
        return (release or 'Win10', version or '10.0.0', csd, ptype)
_platform.win32_ver = _safe_win32_ver
# ──────────────────────────────────────────────────────────────────────────────

from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from pymongo import MongoClient
from config import MONGO_URI, JWT_SECRET_KEY, DEBUG, PORT

# Initialize Flask
app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False  # Tokens don't expire for dev

import os

# Extensions
jwt = JWTManager(app)
ALLOWED_ORIGINS = [
    "http://localhost:5173",                    # Local dev
    "http://localhost:3000",                    # Alt local dev
    os.getenv("FRONTEND_URL", ""),              # Vercel production URL (set in Render env vars)
]
CORS(app, origins=[o for o in ALLOWED_ORIGINS if o], supports_credentials=True)

# MongoDB
client = MongoClient(MONGO_URI)
db = client.get_default_database()

# Make db accessible from routes
app.db = db

# Register Blueprints
from routes.auth import auth_bp
from routes.student import student_bp
from routes.faculty import faculty_bp
from routes.admin import admin_bp
from routes.predict import predict_bp

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(student_bp, url_prefix="/api/student")
app.register_blueprint(faculty_bp, url_prefix="/api/faculty")
app.register_blueprint(admin_bp, url_prefix="/api/admin")
app.register_blueprint(predict_bp, url_prefix="/api")

@app.route("/api/health")
def health():
    return {"status": "ok", "message": "Academic Behavior Profiling API is running"}

if __name__ == "__main__":
    # Create indexes and verify MongoDB connectivity
    try:
        db.users.create_index("email", unique=True)
        print("[OK] Connected to MongoDB")
    except Exception as error:
        print(f"[ERROR] Unable to connect to MongoDB at {MONGO_URI}")
        print("[ERROR] Make sure MongoDB is running on localhost:27017 or update MONGO_URI in backend/.env")
        print(f"[ERROR] {error}")
        import sys
        sys.exit(1)

    print(f"[INFO] Server starting on port {PORT}")
    app.run(debug=DEBUG, port=PORT)
