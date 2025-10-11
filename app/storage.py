import uuid
from typing import Dict
from .models import AuditResult

# For MVP: in-memory store; swap to Redis easily later.
JOBS: Dict[str, AuditResult] = {}

def new_job(url: str) -> str:
    job_id = uuid.uuid4().hex
    JOBS[job_id] = AuditResult(job_id=job_id, url=url, status="pending")
    return job_id

def get_job(job_id: str) -> AuditResult:
    return JOBS[job_id]

def save_job(result: AuditResult):
    JOBS[result.job_id] = result
