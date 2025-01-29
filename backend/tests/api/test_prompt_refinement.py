import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
import json

pytestmark = pytest.mark.asyncio

def test_analyze_prompt_success_skipped():
    """Test successful prompt analysis (skipped for now)."""
    pytest.skip("TODO: Fix analyze_prompt implementation")
