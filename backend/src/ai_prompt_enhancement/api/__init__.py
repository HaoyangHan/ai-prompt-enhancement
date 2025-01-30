from fastapi import APIRouter
from .prompt_routes import router as prompt_router
from .evaluation.routes import router as evaluation_router
from .model.routes import router as model_router

# Create main router
router = APIRouter()

# Include all sub-routers
router.include_router(prompt_router)
router.include_router(evaluation_router)
router.include_router(model_router)
