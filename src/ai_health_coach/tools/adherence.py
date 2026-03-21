import json

from langchain_core.tools import tool


@tool
def get_adherence_summary(patient_id: str) -> str:
    """Get the patient's exercise adherence metrics."""
    metrics = {
        "adherence_pct": 78,
        "streak": 5,
        "best_streak": 8,
        "sessions_completed": 12,
        "sessions_total": 15,
    }
    return json.dumps(metrics)
