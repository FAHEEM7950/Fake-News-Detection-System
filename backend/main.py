from fastapi import FastAPI

app = FastAPI(
    title="Fake News Detection System",
    description="AI-based Fake News Detection and Fact Verification API",
    version="1.0.0"
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