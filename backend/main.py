from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Fake News Detection System",
    description="AI-based Fake News Detection and Fact Verification API",
    version="1.0.0"
)

# Configure CORS middleware for frontend communication
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