import uuid

from langchain_core.tools import tool, StructuredTool
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ai_health_coach.models.patient import Goal


def make_set_goal(session: AsyncSession) -> StructuredTool:
    """Create a set_goal tool bound to the given DB session."""

    @tool
    async def set_goal(patient_id: str, goal_text: str, target_date: str | None = None) -> str:
        """Store a confirmed exercise goal for the patient. Updates existing goal if one exists."""
        stmt = select(Goal).where(Goal.patient_id == patient_id)
        existing = (await session.execute(stmt)).scalar_one_or_none()

        if existing:
            existing.goal_text = goal_text
        else:
            new_goal = Goal(
                id=str(uuid.uuid4()),
                patient_id=patient_id,
                goal_text=goal_text,
            )
            session.add(new_goal)

        await session.commit()
        return f"Goal set for patient {patient_id}: {goal_text}"

    return set_goal
