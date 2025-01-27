# Starting the Backend Service

This guide will help you set up and run the backend service for the AI Prompt Enhancement project.

## Prerequisites

- Python 3.9 or higher
- Conda package manager

## Setup Steps

1. Install Poetry using Conda:
```bash
conda install -c conda-forge poetry
```

2. Create and activate a virtual environment (optional if using Poetry):
```bash
conda create -n ai-prompt-env python=3.9
conda activate ai-prompt-env
```

3. Navigate to the backend directory:
```bash
cd backend
```

4. Install dependencies using Poetry:
```bash
poetry install
```

## Starting the Service

Run the FastAPI server using uvicorn:
```bash
poetry run uvicorn ai_prompt_enhancement.main:app --reload --port 8000
```

The service will be available at `http://localhost:8000`

## Development Notes

- The `--reload` flag enables hot reloading, which automatically restarts the server when code changes are detected
- The default port is 8000, but you can change it using the `--port` flag
- API documentation will be available at:
  - Swagger UI: `http://localhost:8000/docs`
  - ReDoc: `http://localhost:8000/redoc`

## Troubleshooting

If you encounter any issues:

1. Ensure Poetry is installed correctly:
```bash
poetry --version
```

2. Try cleaning Poetry's cache if you have dependency issues:
```bash
poetry cache clear . --all
```

3. Verify your Python version:
```bash
python --version
```

4. Check if all dependencies are installed correctly:
```bash
poetry show
``` 