from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pathlib import Path

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
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="AI Health Coach", lifespan=lifespan)

    static_dir = Path(__file__).parent / "static"
    static_dir.mkdir(exist_ok=True)
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

    templates_dir = Path(__file__).parent / "templates"
    templates_dir.mkdir(exist_ok=True)
    app.state.templates = Jinja2Templates(directory=str(templates_dir), autoescape=True)

    # Mount all routers
    from ai_health_coach.api.auth import router as auth_router
    from ai_health_coach.api.patient_routes import router as patient_router
    from ai_health_coach.api.clinician_routes import router as clinician_router

    app.include_router(auth_router)
    app.include_router(patient_router)
    app.include_router(clinician_router)

    return app


app = create_app()
