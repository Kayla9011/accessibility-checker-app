from typing import List
from .models import Violation

def merge_scores(lighthouse_score: int, axe_penalty_points: int) -> int:
    base = max(0, min(100, lighthouse_score))
    score = max(0, base - axe_penalty_points)
    return score

def compute_penalty(violations: List[Violation]) -> int:
    weights = {"critical": 25, "serious": 12, "moderate": 6, "minor": 2}
    return sum(weights.get(v.severity, 0) for v in violations)

def apply_caps(score: int, violations: List[Violation]):
    cap = {"applied": False, "reason": None}
    critical_rules = {"keyboard-trap", "focus-visible"}  # extend as needed
    if any(v.severity == "critical" and v.rule_id in critical_rules for v in violations):
        cap["applied"] = True
        cap["reason"] = "keyboard_trap_or_focus"
        score = min(score, 70)
    return score, cap
