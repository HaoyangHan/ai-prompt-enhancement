# AI Prompt Enhancement Application

A comprehensive application for analyzing, refining, and evaluating AI prompts.

## Backend Structure

The backend is organized into domain-specific services and core services for better separation of concerns:

### Core Services

- **Config Service**: Manages application configuration using environment variables and YAML files
- **Logging Service**: Provides centralized logging with console and file outputs
- **Storage Service**: Handles data persistence for analysis history, comparisons, and datasets

### Domain Services

1. **Model Service**
   - Manages interactions with AI models
   - Handles model capabilities and configurations
   - Currently supports Deepseek models

2. **Prompt Refinement Service**
   - Analyzes prompt quality and metrics
   - Provides prompt enhancement suggestions
   - Compares original and enhanced prompts

3. **Evaluation Service**
   - Manages evaluation prompts and templates
   - Validates prompt variables against datasets
   - Prepares evaluation data from CSV inputs

## Directory Structure

```
backend/
├── src/
│   └── ai_prompt_enhancement/
│       ├── services/
│       │   ├── core/
│       │   │   ├── config_service.py
│       │   │   ├── logging_service.py
│       │   │   └── storage_service.py
│       │   ├── model/
│       │   │   └── deepseek_service.py
│       │   ├── prompt_refinement/
│       │   │   ├── analyzers.py
│       │   │   ├── prompt_templates.py
│       │   │   └── refinement_service.py
│       │   └── evaluation/
│       │       ├── evaluation_prompts.py
│       │       └── evaluation_service.py
│       └── api/
│           ├── routes/
│           │   ├── evaluation.py
│           │   ├── model.py
│           │   └── refinement.py
│           └── main.py
├── data/
│   ├── analysis/
│   ├── comparisons/
│   ├── evaluations/
│   └── datasets/
└── logs/
```

## Configuration

The application can be configured using:
1. Environment variables
2. YAML configuration file
3. Runtime updates via the config service

Key configuration options include:
- API settings (host, port, debug mode)
- Model settings (default model, timeout, token limits)
- Storage settings (data and log directories)
- CORS settings

## Getting Started

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up configuration:
- Copy `config.example.yaml` to `config.yaml`
- Modify settings as needed

3. Run the application:
```bash
uvicorn ai_prompt_enhancement.api.main:app --reload
```

## API Documentation

The API documentation is available at `/docs` when running the application.

Key endpoints:
- `/api/v1/refinement/analyze`: Analyze and enhance prompts
- `/api/v1/refinement/compare`: Compare original and enhanced prompts
- `/api/v1/evaluation/prompts`: Get available evaluation prompts
- `/api/v1/evaluation/validate`: Validate prompt variables
- `/api/v1/model/capabilities`: Get model capabilities

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

