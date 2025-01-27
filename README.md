# AI Prompt Enhancement System

A comprehensive system for analyzing and enhancing AI prompts using advanced language models. The system provides detailed metrics and suggestions to improve prompt effectiveness.

## Features

- 🔍 Prompt quality analysis using multiple LLM models (GPT-4, GPT-3.5, Claude)
- 📊 Detailed metrics on clarity, completeness, and structure
- 💡 Specific suggestions for prompt improvements
- 🔄 Model-agnostic architecture for easy extension
- 🚀 FastAPI-based backend with async support
- 📝 Comprehensive test suite

## Project Structure

```
.
├── backend/                        # FastAPI backend service
│   ├── src/
│   │   └── ai_prompt_enhancement/
│   │       ├── api/               # API endpoints and routes
│   │       │   └── prompt_routes.py  # Prompt analysis endpoints
│   │       ├── core/              # Core configurations and settings
│   │       │   └── config.py      # Application configuration
│   │       ├── services/          # Business logic layer
│   │       │   ├── analyzers.py   # LLM-based analyzers
│   │       │   └── prompt_service.py  # Prompt analysis service
│   │       ├── schemas/           # Data models and validation
│   │       │   └── prompt.py      # Prompt-related schemas
│   │       └── main.py            # Application entry point
│   ├── tests/                     # Test suite
│   │   ├── unit/                  # Unit tests
│   │   │   └── test_services/     # Service layer tests
│   │   ├── integration/           # Integration tests
│   │   └── conftest.py            # Test configurations
│   ├── pyproject.toml            # Python dependencies
│   ├── .env.example              # Environment variables template
│   └── README.md                 # Backend documentation
├── .gitignore                    # Git ignore rules
├── LICENSE                       # MIT License
└── README.md                     # Project documentation

Key Components:
- api/: FastAPI route definitions and endpoint handlers
- core/: Application configuration and core utilities
- services/: Business logic implementation
  - analyzers.py: Different LLM model implementations
  - prompt_service.py: Main prompt analysis service
- schemas/: Pydantic models for request/response validation
- tests/: Comprehensive test suite with unit and integration tests
```

## Prerequisites

- Python 3.9 or higher
- Poetry (Python package manager)
- OpenAI API key
- (Optional) Anthropic API key for Claude integration

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/HaoyangHan/ai-prompt-enhancement.git
cd ai-prompt-enhancement
```

2. Set up the backend:
```bash
cd backend
poetry install

# Create .env file with your configuration
cp .env.example .env
# Edit .env with your API keys
```

3. Start the backend service:
```bash
poetry run uvicorn ai_prompt_enhancement.main:app --reload
```

4. Access the API documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Development

### Running Tests

```bash
cd backend
poetry run pytest
```

For test coverage:
```bash
poetry run pytest --cov=ai_prompt_enhancement
```

### Code Quality

Format code using Black:
```bash
poetry run black .
```

Sort imports:
```bash
poetry run isort .
```

Run linting:
```bash
poetry run flake8
```

## API Documentation

### POST /api/v1/prompts/analyze

Analyzes a prompt for quality and provides improvement suggestions.

Request:
```json
{
  "prompt_text": "Your prompt here",
  "model_type": "gpt-4",  // Optional
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
      "description": "Evaluation of clarity",
      "suggestions": ["Make objective more explicit"]
    }
  },
  "suggestions": ["Make objective more explicit"],
  "model_type": "gpt-4",
  "timestamp": "2023-11-15T10:30:00Z"
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for GPT models
- Anthropic for Claude model
- FastAPI framework
- All contributors to this project

