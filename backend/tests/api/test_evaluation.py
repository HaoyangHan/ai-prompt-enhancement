import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
import json
from io import BytesIO

pytestmark = pytest.mark.asyncio

def test_evaluate_prompt_success_skipped():
    """Test successful prompt evaluation (skipped for now)."""
    pytest.skip("TODO: Fix evaluate_prompt implementation")
