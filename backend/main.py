
from fastapi import FastAPI

from app.api.routes.case_routes import router as case_router
from app.api.routes.document_routes import router as document_router
from app.api.routes.activity_routes import router as activity_router
from app.api.routes.hearing_routes import router as hearing_router
from app.api.routes.dashboard_routes import router as dashboard_router
from app.api.routes.ai_routes import router as ai_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="NyayaDesk API",
    description="Departmental Legal Case Intelligence System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://nyayadesk-ai.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Welcome to NyayaDesk API",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "application": "NyayaDesk"
    }


app.include_router(case_router, prefix="/api/v1")
app.include_router(document_router, prefix="/api/v1")
app.include_router(activity_router, prefix="/api/v1")
app.include_router(hearing_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(ai_router)
