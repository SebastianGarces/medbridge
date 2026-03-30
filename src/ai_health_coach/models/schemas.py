from datetime import date, datetime

from pydantic import BaseModel, Field


# --- Request Models ---

class ConsentRequest(BaseModel):
    consent: bool


class SendMessageRequest(BaseModel):
    message: str = Field(..., min_length=1)


class GoalSubmitRequest(BaseModel):
    goal_text: str = Field(..., min_length=1)


# --- Response Models ---

class ExerciseVideo(BaseModel):
    token: str
    name: str
    category1: str | None = None
    category2: str | None = None
    thumbnail1: str | None = None
    description: str | None = None
    video_embed_url: str | None = None


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    content_html: str = ""
    created_at: datetime
    exercise_videos: list[ExerciseVideo] = []


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
    patient_name: str | None = None


class GoalResponse(BaseModel):
    id: str
    goal_text: str
    target_date: date | None = None
    progress_pct: int = 0
    created_at: datetime


class AdherenceResponse(BaseModel):
    adherence_pct: int = 0
    streak: int = 0
    best_streak: int = 0
    sessions_completed: int = 0
    sessions_total: int = 0


class WeekDay(BaseModel):
    label: str
    completed: bool
    is_today: bool
    is_future: bool


class GoalsPageResponse(BaseModel):
    goal: GoalResponse | None = None
    adherence: AdherenceResponse
    week_days: list[WeekDay]


class ProgramExercise(BaseModel):
    exercise_id: str
    name: str
    sets: int
    reps: int
    token: str | None = None
    category1: str = ""
    category2: str = ""
    thumbnail1: str = ""
    description: str = ""
    video_embed_url: str = ""
    completed_today: bool = False


class ExercisesPageResponse(BaseModel):
    program_videos: list[ProgramExercise]
    all_videos: list[ExerciseVideo]
    categories: list[str]


class PhaseTransitionResponse(BaseModel):
    id: str
    from_phase: str
    to_phase: str
    reason: str | None = None
    created_at: datetime


class PatientDetailResponse(BaseModel):
    patient: PatientSummary
    messages: list[MessageResponse]
    transitions: list[PhaseTransitionResponse]
    alert_count: int = 0
    goal: GoalResponse | None = None
    adherence: AdherenceResponse | None = None


class DashboardStatsResponse(BaseModel):
    active: int = 0
    avg_adherence: int = 0
    pending_alerts: int = 0
    dormant: int = 0


class DashboardResponse(BaseModel):
    patients: list[PatientSummary]
    stats: DashboardStatsResponse


class PatientStatusResponse(BaseModel):
    phase: str
    consent_given: bool
    has_goal: bool
