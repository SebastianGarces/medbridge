import json

from langchain_core.tools import tool


@tool
def get_program_summary(patient_id: str) -> str:
    """Retrieve the patient's assigned home exercise program."""
    program = {
        "exercises": [
            {"name": "Shoulder flexion stretch", "sets": 3, "reps": 10},
            {"name": "Pendulum swings", "sets": 2, "reps": 15},
            {"name": "Wall climbing stretch", "sets": 3, "reps": 8},
            {"name": "Cross-body stretch", "sets": 2, "reps": 12},
        ]
    }
    return json.dumps(program)
