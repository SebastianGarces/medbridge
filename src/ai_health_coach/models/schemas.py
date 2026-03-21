from datetime import datetime

from pydantic import BaseModel, Field


class ConsentRequest(BaseModel):
    consent: bool


class SendMessageRequest(BaseModel):
    message: str = Field(..., min_length=1)


class GoalSubmitRequest(BaseModel):
    goal_text: str = Field(..., min_length=1)


class PatientSummary(BaseModel):
    id: str
    name: str
    phase: str
    consent_given: bool
    adherence_pct: int = 0
    last_interaction_at: datetime | None = None
    alert_count: int = 0


class AlertResponse(BaseModel):
    id: str
    patient_id: str
    severity: str
    title: str
    description: str
    acknowledged: bool
    created_at: datetime


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime
