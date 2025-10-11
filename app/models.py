from pydantic import BaseModel, AnyHttpUrl, Field
from typing import List, Literal, Optional, Union, Dict
from datetime import datetime

Severity = Literal["minor", "moderate", "serious", "critical"]
Status = Literal["pending", "running", "done", "failed"]

class ViolationNode(BaseModel):
    target: List[str]
    html: str = ""
    failureSummary: str = ""

class Violation(BaseModel):
    source: Literal["axe", "lighthouse"]
    rule_id: str
    severity: Severity
    description: str = ""
    help: str = ""
    helpUrl: str = ""
    wcag_refs: List[str] = []
    nodes: List[ViolationNode] = []

class Caps(BaseModel):
    critical_cap_applied: bool = False
    cap_reason: Optional[str] = None

class AuditResult(BaseModel):
    job_id: str
    url: str
    status: Status
    score: int = 0
    caps: Caps = Caps()
    violations: List[Violation] = []
    raw: Dict[str, Union[dict, list, str, int, float, bool, None]] = {}
    generated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    testEngine: str = "axe+lighthouse"

class CreateAuditBody(BaseModel):
    url: AnyHttpUrl
    html: Optional[str] = None
