from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .prompt_routes import router as prompt_router
from .evaluation.routes import router as evaluation_router
from .model.routes import router as model_router
from .synthetic_data_routes import router as synthetic_data_router

# Create main router with prefix
router = APIRouter(prefix="/api/v1")

# Include all sub-routers
router.include_router(prompt_router)
router.include_router(evaluation_router)
router.include_router(model_router)
router.include_router(synthetic_data_router)

def create_app() -> FastAPI:
    app = FastAPI(
        title="AI Prompt Enhancement API",
        description="API for analyzing, refining, and generating AI prompts",
        version="1.0.0"
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # In production, replace with specific origins
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include the main router
    app.include_router(router)

    return app
