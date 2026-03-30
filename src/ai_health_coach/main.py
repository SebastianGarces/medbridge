from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ai_health_coach.config import get_settings
from ai_health_coach.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Seed demo users
    from ai_health_coach.database import get_session_factory
    from ai_health_coach.api.auth import seed_demo_users

    factory = get_session_factory()
    async with factory() as session:
        await seed_demo_users(session)

    # Start the scheduler for follow-up check-ins
    from ai_health_coach.scheduler.followup import (
        get_scheduler, configure_callback, set_scheduler_ref, fire_pending_reminders,
    )
    from ai_health_coach.api.patient_routes import _get_llm
    scheduler = get_scheduler()
    configure_callback(_get_llm)
    set_scheduler_ref(scheduler)
    scheduler.start()
    app.state.scheduler = scheduler

    # Poll for pending reminders every hour
    scheduler.add_job(
        fire_pending_reminders,
        trigger="interval",
        hours=1,
        id="reminder-poll",
        replace_existing=True,
    )

    yield

    # Shutdown scheduler
    if hasattr(app.state, "scheduler"):
        app.state.scheduler.shutdown(wait=False)


def create_app() -> FastAPI:
    app = FastAPI(title="AI Health Coach", lifespan=lifespan)

    settings = get_settings()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount all routers
    from ai_health_coach.api.auth import router as auth_router
    from ai_health_coach.api.patient_routes import router as patient_router
    from ai_health_coach.api.clinician_routes import router as clinician_router
    from ai_health_coach.api.sse import router as sse_router

    app.include_router(auth_router)
    app.include_router(patient_router)
    app.include_router(clinician_router)
    app.include_router(sse_router)

    return app


app = create_app()
