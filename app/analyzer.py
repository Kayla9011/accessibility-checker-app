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

def _worker_script_path() -> str:
    here = Path(__file__).resolve()
    return str(here.parent.parent / "worker" / "audit_worker.mjs")

def _node_available() -> bool:
    return shutil.which(settings.NODE_BIN) is not None and Path(_worker_script_path()).is_file()

def _to_str_list(target_any) -> List[str]:
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
        out.append(str(target_any))
    return out

def run_node_worker(url: str, html: Optional[str]) -> Tuple[dict, dict, dict]:
    """
    Run Node worker and return (lighthouse_json, axe_json, diagnostic_json).
    Uses file I/O for both input and output to avoid pipe truncation.
    """
    cmd = [settings.NODE_BIN, _worker_script_path()]

    with tempfile.NamedTemporaryFile("w+", delete=False, suffix=".json") as fin, \
         tempfile.NamedTemporaryFile("w+", delete=False, suffix=".json") as fout:
        json.dump({"url": url, "html": html}, fin)
        in_path, out_path = fin.name, fout.name

    try:
        # Node writes result JSON to out_path. We ignore stdout/stderr.
        subprocess.run(
            cmd + [in_path, out_path],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            text=True,
            timeout=max(60, settings.NODE_TIMEOUT_SEC),
        )
        # Read back result
        with open(out_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        lh = data.get("lighthouse", {}) or {}
        axe = data.get("axe", {}) or {}
        diag = data.get("_diagnostic", {}) or {}
        return lh, axe, diag
    except subprocess.CalledProcessError as e:
        # surface worker errors
        err = e.stderr or str(e)
        print("[WORKER_ERROR]", err)
        raise
    finally:
        for p in (in_path, out_path):
            try:
                os.remove(p)
            except OSError:
                pass

def mock_results(url: str) -> Tuple[dict, dict, dict]:
    lighthouse = {"categories": {"accessibility": {"score": 0.86}}}
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
    diag = {"note": "MOCK_PAYLOAD"}
    return lighthouse, axe, diag

def normalize_violations(axe_json: dict) -> List[Violation]:
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
                wcag_refs=[],
                nodes=nodes,
            )
        )
    return out

def analyze(url: str, html: Optional[str]):
    """
    Returns: (lighthouse_score:int, violations:List[Violation], raw:dict)
    raw includes _diagnostic so UI/clients can see auditedUrl/title/etc.
    """
    use_node = _node_available()
    if not use_node and not settings.ALLOW_MOCK_FALLBACK:
        raise RuntimeError("Node worker not available and mock fallback disabled")

    try:
        if use_node:
            lighthouse, axe, diag = run_node_worker(url, html)
        else:
            lighthouse, axe, diag = mock_results(url)
    except Exception as e:
        if settings.ALLOW_MOCK_FALLBACK:
            lighthouse, axe, diag = mock_results(url)
            diag = {"fallback": "mock_used_due_to_exception", "error": str(e), **diag}
        else:
            raise

    lh_score = int(round((lighthouse.get("categories", {}).get("accessibility", {}).get("score") or 0) * 100))
    violations = normalize_violations(axe)
    raw = {"lighthouse": lighthouse, "axe": axe, "_diagnostic": diag}
    return lh_score, violations, raw
