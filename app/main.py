from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import CreateAuditBody, AuditResult, Caps
from . import analyzer, scoring, storage, settings

app = FastAPI(title="Backend B - Accessibility Analyzer", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/api/audits")
def create_audit(body: CreateAuditBody):
    # sync analysis, write results to storage
    job_id = storage.new_job(str(body.url))
    job = storage.get_job(job_id)

    try:
        lh_score, violations, raw = analyzer.analyze(job.url, body.html)
        penalty = scoring.compute_penalty(violations)
        merged = scoring.merge_scores(lh_score, penalty)
        capped, cap_info = scoring.apply_caps(merged, violations)

        result = AuditResult(
            job_id=job_id,
            url=job.url,
            status="done",
            score=capped,
            caps=Caps(
                critical_cap_applied=bool(cap_info.get("applied")),
                cap_reason=cap_info.get("reason")
            ),
            violations=violations,
            raw=raw,
            testEngine="axe+lighthouse",
        )
        storage.save_job(result)
        return {"job_id": job_id}
    except Exception as e:
        job.status = "failed"
        storage.save_job(job)
        raise HTTPException(status_code=500, detail=f"analysis_failed: {e}")

@app.get("/api/audits/{job_id}", response_model=AuditResult)
def get_audit(job_id: str):
    try:
        return storage.get_job(job_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="job_not_found")
