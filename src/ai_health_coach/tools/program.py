import json

from langchain_core.tools import tool, StructuredTool
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ai_health_coach.models.patient import AssignedExercise


def make_get_program_summary(session: AsyncSession) -> StructuredTool:
    """Create a get_program_summary tool bound to the given DB session."""

    @tool
    async def get_program_summary(patient_id: str) -> str:
        """Retrieve the patient's assigned home exercise program."""
        stmt = select(AssignedExercise).where(AssignedExercise.patient_id == patient_id)
        exercises = (await session.execute(stmt)).scalars().all()
        program = {
            "exercises": [
                {
                    "name": e.exercise_name,
                    "sets": e.sets,
                    "reps": e.reps,
                    "token": e.exercise_token,
                }
                for e in exercises
            ]
        }
        return json.dumps(program)

    return get_program_summary
