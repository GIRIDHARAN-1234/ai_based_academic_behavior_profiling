from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token
import bcrypt
from datetime import datetime
import pymongo.errors

auth_bp = Blueprint("auth", __name__)

def get_db():
    return current_app.db

@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        db = get_db()
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        required = ["name", "email", "password", "role"]
        missing = [k for k in required if k not in data]
        if missing:
            return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

        role = data["role"].lower()
        if role not in ["student", "faculty"]:
            return jsonify({"error": "Role must be student or faculty"}), 400

        # Check duplicate
        if db.users.find_one({"email": data["email"]}):
            return jsonify({"error": "Email already registered. Please use a different email or log in."}), 409

        try:
            hashed_pw = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt()).decode()
        except Exception as e:
            return jsonify({"error": "Failed to process password securely"}), 500

        # Faculty needs admin approval; students are auto-active
        status = "pending" if role == "faculty" else "active"

        user = {
            "name": data["name"],
            "email": data["email"],
            "password": hashed_pw,
            "role": role,
            "department": data.get("department", ""),
            "status": status,
            "created_at": datetime.utcnow(),
            # Academic fields (student-specific)
            "attendance": data.get("attendance", 0),
            "internal_marks": data.get("internal_marks", 0),
            "exam_marks": data.get("exam_marks", 0),
        }
        
        result = db.users.insert_one(user)
        return jsonify({
            "message": f"Registered successfully. {'Awaiting admin approval.' if status == 'pending' else 'You can now log in.'}",
            "id": str(result.inserted_id)
        }), 201
    except pymongo.errors.DuplicateKeyError:
        return jsonify({"error": "Email already registered (simultaneous attempt)"}), 409
    except Exception as e:
        current_app.logger.error(f"Registration error: {str(e)}")
        return jsonify({"error": "An unexpected error occurred during registration. Please try again later."}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        db = get_db()
        data = request.get_json()
        if not data or not data.get("email") or not data.get("password"):
            return jsonify({"error": "Email and password required"}), 400

        # Admin credentials (hardcoded for simplicity)
        if data["email"] == "admin@academic.com" and data["password"] == "admin123":
            token = create_access_token(identity="admin", additional_claims={"role": "admin", "name": "System Admin"})
            return jsonify({"token": token, "role": "admin", "name": "System Admin", "id": "admin"})

        user = db.users.find_one({"email": data["email"]})
        if not user:
            return jsonify({"error": "Invalid email or password"}), 401

        try:
            if not bcrypt.checkpw(data["password"].encode(), user["password"].encode()):
                return jsonify({"error": "Invalid email or password"}), 401
        except Exception:
             return jsonify({"error": "Authentication failed. Error verifying credentials."}), 401

        if user.get("status") != "active":
            return jsonify({"error": "Account not yet activated. Please wait for admin approval."}), 403

        token = create_access_token(
            identity=str(user["_id"]),
            additional_claims={"role": user["role"], "name": user["name"]}
        )
        return jsonify({
            "token": token,
            "role": user["role"],
            "name": user["name"],
            "id": str(user["_id"])
        })
    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return jsonify({"error": "An unexpected error occurred during login. Please try again later."}), 500

@auth_bp.route("/logout", methods=["POST"])
def logout():
    return jsonify({"message": "Logged out successfully"})
