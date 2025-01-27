#!/bin/bash

# Activate virtual environment if using poetry
echo "Starting AI Prompt Enhancement API..."

# Check if running in development mode
if [ "$ENVIRONMENT" = "development" ]; then
    echo "Running in development mode with auto-reload..."
    uvicorn src.ai_prompt_enhancement.main:app --host 0.0.0.0 --port 8000 --reload
else
    echo "Running in production mode..."
    uvicorn src.ai_prompt_enhancement.main:app --host 0.0.0.0 --port 8000
fi 