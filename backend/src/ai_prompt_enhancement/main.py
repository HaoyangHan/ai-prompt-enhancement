from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import sys

from .api import router
from .api.prompt_routes import tags_metadata as prompt_tags
from .api.evaluation.routes import tags_metadata as evaluation_tags
from .core.config import get_settings

# Configure loguru
logger.remove()  # Remove default handler
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="DEBUG"
)
logger.add(
    "logs/api.log",
    rotation="500 MB",
    retention="10 days",
    level="DEBUG",
    format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}"
)

settings = get_settings()
logger.info(f"Starting application with settings: {settings.dict()}")

app = FastAPI(
    title="AI Prompt Enhancement API",
    description="""
    A comprehensive API for analyzing, refining, and evaluating AI prompts.
    
    ## Features
    
    ### Prompt Refinement
    - Analyze prompts for quality metrics
    - Get improvement suggestions
    - Compare original and enhanced prompts
    
    ### Evaluation
    - Pre-defined evaluation templates
    - Custom evaluation criteria
    - Batch evaluation with CSV data
    
    ### Model Management
    - Multiple model support
    - Model capability discovery
    - Performance tracking
    
    ## Authentication
    
    Currently, the API uses API key authentication for model services.
    Add your API keys in the configuration file or environment variables.
    
    ## Rate Limiting
    
    Basic rate limiting is implemented to prevent abuse:
    - 100 requests per minute for analysis endpoints
    - 50 requests per minute for comparison endpoints
    
    ## Error Handling
    
    The API uses standard HTTP status codes:
    - 200: Success
    - 400: Bad Request (invalid input)
    - 401: Unauthorized (invalid API key)
    - 404: Not Found
    - 429: Too Many Requests
    - 500: Internal Server Error
    
    ## Endpoints
    
    Detailed documentation for each endpoint is available below.
    """,
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    openapi_tags=[
        *prompt_tags,
        *evaluation_tags,
        {
            "name": "health",
            "description": "Health check endpoints to monitor API status"
        }
    ]
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routes
app.include_router(
    router,
    prefix="/api/v1",
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal server error"}
    }
)

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