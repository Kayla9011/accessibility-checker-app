from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import CreateAuditBody, AuditResult, Caps
from . import storage, analyzer, scoring

app = FastAPI(title="Backend B - Accessibility Analyzer", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/audits")
def create_audit(body: CreateAuditBody):
    job_id = storage.new_job(str(body.url))
    job = storage.get_job(job_id)
    job.status = "running"
    storage.save_job(job)

    try:
        lh_score, violations, raw = analyzer.analyze(job.url, body.html)
        penalty = scoring.compute_penalty(violations)
        merged = scoring.merge_scores(lh_score, penalty)
        capped, cap_info = scoring.apply_caps(merged, violations)

        job.score = capped
        job.caps = Caps(critical_cap_applied=cap_info["applied"], cap_reason=cap_info["reason"])
        job.violations = violations
        job.raw = raw
        job.status = "done"
        storage.save_job(job)
    except Exception as e:
        job.status = "failed"
        storage.save_job(job)
        raise HTTPException(status_code=500, detail=f"analysis_failed: {e}")

    return {"job_id": job_id}

@app.get("/api/audits/{job_id}", response_model=AuditResult)
def get_audit(job_id: str):
    try:
        return storage.get_job(job_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="job_not_found")
