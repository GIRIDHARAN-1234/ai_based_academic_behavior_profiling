import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/academic_behavior_db")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "academic_behavior_super_secret_2024")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "ml", "model.pkl")
DEBUG = os.getenv("DEBUG", "True") == "True"
PORT = int(os.getenv("PORT", 5000))
