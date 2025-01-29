import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
import json

pytestmark = pytest.mark.asyncio

def test_get_model_capabilities_success_skipped():
    """Test successful retrieval of model capabilities (skipped for now)."""
    pytest.skip("TODO: Fix model error handling")
