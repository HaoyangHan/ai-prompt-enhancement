# AI Prompt Enhancement Backend Tests

This directory contains the test suite for the AI Prompt Enhancement backend service. The tests are written using pytest and follow a structured organization pattern.

## Test Structure

```
tests/
├── conftest.py              # Shared fixtures and configurations
├── integration/            
│   └── test_api.py         # API endpoint integration tests
└── unit/
    └── test_services/
        ├── test_analyzers.py    # Analyzer service unit tests
        └── test_prompt_service.py # Prompt service unit tests
```

## Test Categories

### Unit Tests
- **Analyzer Tests**: Tests for individual analyzer implementations and the analyzer factory
- **Prompt Service Tests**: Tests for the prompt service business logic

### Integration Tests
- **API Tests**: End-to-end tests for API endpoints
- **Request/Response Tests**: Validation of API request/response structures

## Running Tests

### Basic Test Execution
```bash
# Run all tests
poetry run pytest

# Run with verbose output
poetry run pytest -v

# Run with test coverage report
poetry run pytest --cov=ai_prompt_enhancement
```

### Specific Test Selection
```bash
# Run only unit tests
poetry run pytest tests/unit/

# Run only integration tests
poetry run pytest tests/integration/

# Run a specific test file
poetry run pytest tests/unit/test_services/test_analyzers.py
```

### Test Options

```bash
# Show print statements during tests
poetry run pytest -s

# Stop on first failure
poetry run pytest -x

# Show local variables on failure
poetry run pytest --showlocals

# Run tests matching specific names
poetry run pytest -k "test_analyzer"
```

## Writing Tests

### Test Fixtures
Common test fixtures are available in `conftest.py`:
- `test_client`: FastAPI test client
- `mock_analyzer`: Mock implementation of the analyzer
- `sample_prompt`: Sample prompt text for testing
- `sample_context`: Sample context for testing

### Example Test
```python
@pytest.mark.asyncio
async def test_analyzer_with_context(mock_analyzer, sample_prompt, sample_context):
    metrics = await mock_analyzer.analyze(sample_prompt, sample_context)
    assert "clarity" in metrics
    assert metrics["clarity"].score == 0.8
```

### Mocking
The test suite uses a `MockAnalyzer` class to simulate LLM responses without making actual API calls. This ensures:
- Fast test execution
- Consistent test results
- No dependency on external services
- No API costs during testing

## Test Coverage

To generate a detailed coverage report:
```bash
# Generate coverage report
poetry run pytest --cov=ai_prompt_enhancement --cov-report=term-missing

# Generate HTML coverage report
poetry run pytest --cov=ai_prompt_enhancement --cov-report=html
```

## Best Practices

1. **Test Independence**: Each test should be independent and not rely on the state from other tests
2. **Meaningful Names**: Use descriptive test names that indicate what is being tested
3. **AAA Pattern**: Structure tests using Arrange-Act-Assert pattern
4. **Use Fixtures**: Leverage fixtures for common setup and test data
5. **Mock External Services**: Always mock external API calls
6. **Error Cases**: Test both success and error scenarios
7. **Clean Code**: Keep tests clean and maintainable

## Adding New Tests

When adding new tests:
1. Choose the appropriate directory (unit or integration)
2. Follow the existing naming conventions
3. Use the provided fixtures when possible
4. Add new fixtures to `conftest.py` if needed
5. Include both positive and negative test cases
6. Document any complex test scenarios

## Continuous Integration

The test suite is integrated with CI/CD pipelines and runs automatically on:
- Pull requests
- Merges to main branch
- Release tags

Tests must pass before code can be merged or deployed. 