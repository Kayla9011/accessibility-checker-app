# tests/test_api_mock.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_and_get_audit():
    r = client.post("/api/audits", json={"url": "https://example.com"})
    assert r.status_code == 200
    job_id = r.json()["job_id"]

    r2 = client.get(f"/api/audits/{job_id}")
    assert r2.status_code == 200
    data = r2.json()
    assert data["status"] in ("done","failed")
    assert "score" in data
    assert "violations" in data
