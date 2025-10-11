# tests/test_scoring.py
from app.scoring import compute_penalty, merge_scores, apply_caps
from app.models import Violation, ViolationNode

def _v(rule, sev):
    return Violation(source="axe", rule_id=rule, severity=sev, nodes=[ViolationNode(target=[], html="", failureSummary="")])

def test_penalty_weights():
    vs = [_v("a","minor"), _v("b","moderate"), _v("c","serious"), _v("d","critical")]
    assert compute_penalty(vs) > compute_penalty(vs[:-1])

def test_merge_and_cap():
    vs = [_v("keyboard-trap","critical")]
    score = merge_scores(95, compute_penalty(vs))
    capped, info = apply_caps(score, vs)
    assert capped <= 70
    assert info["applied"] is True
