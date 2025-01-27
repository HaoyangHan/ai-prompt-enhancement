from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.prompt_routes import router as prompt_router

app = FastAPI(
    title="AI Prompt Enhancement API",
    description="API for analyzing and enhancing AI prompts",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default development port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(prompt_router)

@app.get("/health")
async def health_check():
    return {"status": "healthy"} 