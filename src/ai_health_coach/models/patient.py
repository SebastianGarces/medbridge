import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ai_health_coach.database import Base
from ai_health_coach.models.enums import Phase


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    phase: Mapped[str] = mapped_column(String, default=Phase.PENDING)
    unanswered_count: Mapped[int] = mapped_column(Integer, default=0)
    consent_given: Mapped[bool] = mapped_column(Boolean, default=False)
    consent_given_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_interaction_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    goal: Mapped["Goal | None"] = relationship(
        back_populates="patient", uselist=False, lazy="selectin"
    )
    messages: Mapped[list["Message"]] = relationship(
        back_populates="patient", lazy="selectin"
    )
    alerts: Mapped[list["Alert"]] = relationship(
        back_populates="patient", lazy="selectin"
    )
    assigned_exercises: Mapped[list["AssignedExercise"]] = relationship(
        back_populates="patient", lazy="selectin"
    )


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"))
    goal_text: Mapped[str] = mapped_column(String, nullable=False)
    target_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    progress_pct: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    patient: Mapped["Patient"] = relationship(back_populates="goal")


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"))
    role: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    patient: Mapped["Patient"] = relationship(back_populates="messages")


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"))
    severity: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    patient: Mapped["Patient"] = relationship(back_populates="alerts")


class PhaseTransition(Base):
    __tablename__ = "phase_transitions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"))
    from_phase: Mapped[str] = mapped_column(String, nullable=False)
    to_phase: Mapped[str] = mapped_column(String, nullable=False)
    reason: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())


class AssignedExercise(Base):
    __tablename__ = "assigned_exercises"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"))
    exercise_name: Mapped[str] = mapped_column(String, nullable=False)
    exercise_token: Mapped[str | None] = mapped_column(String, nullable=True)
    sets: Mapped[int] = mapped_column(Integer, default=3)
    reps: Mapped[int] = mapped_column(Integer, default=10)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    patient: Mapped["Patient"] = relationship(back_populates="assigned_exercises")
    sessions: Mapped[list["ExerciseSession"]] = relationship(
        back_populates="exercise", lazy="selectin"
    )


class ExerciseSession(Base):
    __tablename__ = "exercise_sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    exercise_id: Mapped[str] = mapped_column(ForeignKey("assigned_exercises.id"))
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"))
    completed_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    exercise: Mapped["AssignedExercise"] = relationship(back_populates="sessions")


class Reminder(Base):
    __tablename__ = "reminders"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"))
    reminder_type: Mapped[str] = mapped_column(String, nullable=False)
    scheduled_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    fired: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
