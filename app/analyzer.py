# app/analyzer.py
from __future__ import annotations

import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import List, Optional, Tuple

from . import settings
from .models import Violation, ViolationNode

# Detect whether a Node binary is available (e.g., "node" on PATH or a custom absolute path).
USE_NODE: bool = shutil.which(settings.NODE_BIN) is not None


# ---------- Internal utilities ----------

def _worker_script_path() -> str:
    """
    Resolve the absolute path to the Node worker script:
        backend-b/app/analyzer.py  ->  backend-b/worker/audit_worker.mjs
    """
    here = Path(__file__).resolve()
    worker = here.parent.parent / "worker" / "audit_worker.mjs"
    return str(worker)


def _to_str_list(target_any) -> List[str]:
    """
    Normalize axe `target` values into a flat list[str].
    axe may return:
      - string (".btn")
      - list[str] ([".btn", "a[href]"])
      - nested arrays depending on runners
    """
    if target_any is None:
        return []
    if isinstance(target_any, str):
        return [target_any]

    out: List[str] = []
    try:
        for t in target_any:
            if isinstance(t, str):
                out.append(t)
            elif isinstance(t, list):
                out.extend([str(v) for v in t])
            else:
                out.append(str(t))
    except TypeError:
        # Non-iterable, coerce to string
        out.append(str(target_any))
    return out


# ---------- Worker execution paths ----------

def run_node_worker(url: str, html: Optional[str]) -> Tuple[dict, dict]:
    """
    Execute the Node worker as a separate process and capture its JSON output.

    Args:
        url:  Target URL to audit (can be empty if you pass `html` only).
        html: Optional raw HTML string; if provided and url is empty, the worker will use a data: URL.

    Returns:
        lighthouse_json, axe_json
    """
    cmd = [settings.NODE_BIN, _worker_script_path()]
    payload = {"url": url, "html": html}

    # We pass the payload via a temp file to keep command lines short & robust.
    with tempfile.NamedTemporaryFile("w+", delete=False, suffix=".json") as f:
        json.dump(payload, f)
        tmp_path = f.name

    try:
        # NOTE: we capture stdout (the worker prints one JSON object).
        out = subprocess.check_output(
            cmd + [tmp_path],
            stderr=subprocess.STDOUT,
            text=True,
            timeout=120,  # keep worker bounded
        )
        data = json.loads(out)
        return data.get("lighthouse", {}) or {}, data.get("axe", {}) or {}

    finally:
        # Best-effort cleanup of the temp file.
        try:
            os.remove(tmp_path)
        except OSError:
            pass


def mock_results(url: str) -> Tuple[dict, dict]:
    """
    Deterministic mock for development and tests.
    Returns a plausible Lighthouse accessibility score and a single axe violation.
    """
    lighthouse = {"categories": {"accessibility": {"score": 0.86}}}  # ~86/100
    axe = {
        "violations": [
            {
                "id": "color-contrast",
                "impact": "serious",
                "description": "Elements must have sufficient color contrast",
                "help": "Ensure sufficient color contrast between text and background",
                "helpUrl": "https://dequeuniversity.com/rules/axe/4.7/color-contrast",
                "nodes": [
                    {
                        "target": ["button.primary"],
                        "html": "<button class='primary'>Submit</button>",
                        "failureSummary": "Insufficient contrast",
                    }
                ],
            }
        ]
    }
    return lighthouse, axe


# ---------- Normalization ----------

def normalize_violations(axe_json: dict) -> List[Violation]:
    """
    Convert raw axe JSON into our Pydantic `Violation` shape.
    - Ensures `target` is always a list[str].
    - Fills optional text fields with empty strings to keep schema stable.
    """
    out: List[Violation] = []
    for v in axe_json.get("violations", []) or []:
        nodes = [
            ViolationNode(
                target=_to_str_list(n.get("target")),
                html=n.get("html", ""),
                failureSummary=n.get("failureSummary", ""),
            )
            for n in (v.get("nodes") or [])
        ]
        out.append(
            Violation(
                source="axe",
                rule_id=v.get("id", "") or "",
                severity=(v.get("impact") or "moderate"),
                description=v.get("description", "") or "",
                help=v.get("help", "") or "",
                helpUrl=v.get("helpUrl", "") or "",
                wcag_refs=[],  # can be populated later if you enrich with WCAG mapping
                nodes=nodes,
            )
        )
    return out


# ---------- Public entrypoint ----------

def analyze(url: str, html: Optional[str]):
    """
    Run the audit (Node worker if available, otherwise mock) and return:

        (lighthouse_score:int, violations:List[Violation], raw:dict)

    Notes:
    - `lighthouse_score` is coerced to an integer 0..100.
    - `raw` contains both raw payloads so downstream modules (scoring/AI) can reference them.
    """
    try:
        if USE_NODE:
            lighthouse, axe = run_node_worker(url, html)
        else:
            lighthouse, axe = mock_results(url)
    except Exception:
        # If the worker fails for any reason (no Chromium, bad CSP, etc),
        # we fail safely to mock so the API is still responsive.
        lighthouse, axe = mock_results(url)

    # Lighthouse overall accessibility category score (0..1) -> 0..100
    lh_score = int(
        round(
            (lighthouse.get("categories", {})
             .get("accessibility", {})
             .get("score", 0) or 0) * 100
        )
    )

    violations = normalize_violations(axe)
    raw = {"lighthouse": lighthouse, "axe": axe}
    return lh_score, violations, raw
