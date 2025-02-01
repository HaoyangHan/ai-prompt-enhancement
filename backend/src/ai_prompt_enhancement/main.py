from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import sys
from pathlib import Path

from .api import synthetic_data_routes
from .core.config import settings

# Create logs directory if it doesn't exist
Path("logs").mkdir(exist_ok=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,  # Set default level to INFO
    format='%(asctime)s | %(levelname)-8s | %(name)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.StreamHandler(sys.stderr),
        logging.FileHandler('logs/api.log', encoding='utf-8')
    ]
)

# Set specific log levels for different modules
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("openai").setLevel(logging.WARNING)
logging.getLogger("uvicorn").setLevel(logging.INFO)

# Get logger for this module
logger = logging.getLogger(__name__)

# Create the FastAPI application
app = FastAPI(
    title=settings.app_name,
    debug=settings.debug
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize application
logger.info("Starting application with settings: %s", settings.dict())

# Include routers
app.include_router(synthetic_data_routes.router, prefix=settings.api_prefix)

@app.get("/health", tags=["health"])
async def health_check():
    """
    Health check endpoint to verify API status.
    
    Returns:
        dict: Status information including version and uptime
    """
    logger.debug("Health check endpoint called")
    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": "development" if settings.debug else "production"
    } 