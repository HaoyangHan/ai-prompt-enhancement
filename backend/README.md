# AI Prompt Enhancement Backend

A FastAPI-based backend service for analyzing and enhancing AI prompts using various language models.

## Features

- Prompt quality analysis using different LLM models (GPT-4, GPT-3.5, Claude)
- Detailed metrics on prompt clarity, completeness, and structure
- Specific suggestions for prompt improvements
- Model-agnostic architecture for easy extension

## Prerequisites

- Python 3.9 or higher
- Poetry (Python package manager)
- OpenAI API key
- (Optional) Anthropic API key for Claude integration

## Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies using Poetry:
```bash
poetry install
```

3. Create a `.env` file in the backend directory with your configuration:
```env
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here  # Optional
DEBUG=True
CORS_ORIGINS=["http://localhost:3000"]
```

## Running the Service

### Development Mode

Run the service with auto-reload enabled:
```bash
poetry run uvicorn ai_prompt_enhancement.main:app --reload --port 8000
```

### Production Mode

Run the service in production mode:
```bash
poetry run uvicorn ai_prompt_enhancement.main:app --host 0.0.0.0 --port 8000
```

## API Documentation

Once the service is running, you can access the API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### POST /api/v1/prompts/analyze

Analyzes a prompt for quality and provides improvement suggestions.

Request body:
```json
{
  "prompt_text": "Your prompt here",
  "model_type": "gpt-4",  // Optional: defaults to "default"
  "context": "Additional context"  // Optional
}
```

Response:
```json
{
  "overall_score": 0.8,
  "metrics": {
    "clarity": {
      "score": 0.8,
      "description": "Evaluation of prompt clarity and directness",
      "suggestions": ["Make the objective more explicit"]
    },
    // ... other metrics
  },
  "suggestions": ["Make the objective more explicit", "Add more examples"],
  "model_type": "gpt-4",
  "timestamp": "2023-11-15T10:30:00Z"
}
```

## Development

### Running Tests

```bash
poetry run pytest
```

### Code Formatting

Format code using Black:
```bash
poetry run black .
```

Sort imports using isort:
```bash
poetry run isort .
```

Run linting checks:
```bash
poetry run flake8
```

## Project Structure

```
backend/
├── src/
│   └── ai_prompt_enhancement/
│       ├── api/            # API routes and endpoints
│       ├── core/           # Core configurations
│       ├── services/       # Business logic and services
│       └── schemas/        # Pydantic models
├── tests/                  # Test files
├── pyproject.toml         # Poetry dependencies
└── README.md
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests and ensure they pass
4. Submit a pull request

## License

MIT

