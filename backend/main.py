from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
from pathlib import Path

from .preprocessor import clean_text


# Create FastAPI application
app = FastAPI(
    title="Fake News Detection System",
    description="ML and NLP based Fake News Detection API",
    version="1.0.0"
)


# -----------------------------
# CORS Configuration
# -----------------------------

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Load trained ML files
# -----------------------------

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"

vectorizer = joblib.load(
    MODEL_DIR / "tfidf_vectorizer.joblib"
)

model = joblib.load(
    MODEL_DIR / "naive_bayes_model.joblib"
)


# -----------------------------
# Request format
# -----------------------------

class NewsInput(BaseModel):
    text: str


# -----------------------------
# Routes
# -----------------------------

@app.get("/")
def root():
    return {
        "message": "Fake News Detection API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.post("/predict")
def predict_news(news: NewsInput):

    # 1. Clean the input text
    cleaned_text = clean_text(news.text)

    # 2. Convert text into TF-IDF features
    features = vectorizer.transform([cleaned_text])

    # 3. Predict REAL / FAKE
    prediction = model.predict(features)[0]

    # 4. Get model probability
    probabilities = model.predict_proba(features)[0]
    confidence = float(max(probabilities))

    return {
        "prediction": prediction,
        "confidence": round(confidence, 4)
    }