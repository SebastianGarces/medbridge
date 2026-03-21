# AI Health Coach

An AI-powered health coaching platform for home exercise programs, built with FastAPI, LangGraph, and LangChain. The system guides patients through consent, onboarding, goal-setting, and ongoing coaching via a conversational interface, while providing clinicians with a dashboard for monitoring patient progress, reviewing conversations, and managing safety alerts. A two-layer safety classifier (keyword + LLM) ensures all coach responses stay within scope, escalating clinical or crisis content to human providers.

## Prerequisites

- **Python** >= 3.11
- **pip** (or a virtualenv manager like `venv`)
- An **OpenAI API key** with access to `gpt-4o` (or the model specified in `MODEL_NAME`)

## Environment Variables

The app loads configuration via [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/) from environment variables or a `.env` file in the project root.

| Variable | Description | Default / Example |
|---|---|---|
| `DATABASE_URL` | SQLAlchemy async database connection string | `sqlite+aiosqlite:///./coach.db` |
| `OPENAI_API_KEY` | OpenAI API key for LLM calls (LangChain) | `sk-proj-...` (no usable default — must be set) |
| `MODEL_NAME` | OpenAI model identifier | `gpt-4o` |
| `SECRET_KEY` | Secret used to sign session cookies (change in production) | `dev-secret-key-change-in-production` |

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=sk-proj-your-key-here
SECRET_KEY=change-me-in-production
# DATABASE_URL=sqlite+aiosqlite:///./coach.db   # optional, uses default
# MODEL_NAME=gpt-4o                              # optional, uses default
```

## Setup

```bash
# 1. Clone the repository
git clone <repo-url> && cd medbridge

# 2. Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 3. Install dependencies (including dev tools)
pip install -e ".[dev]"

# 4. Create your .env file (see Environment Variables above)
cp .env.example .env 2>/dev/null || echo 'OPENAI_API_KEY=sk-proj-...' > .env

# 5. The SQLite database is created automatically on first startup
```

## How to Run

```bash
# Start the development server
uvicorn ai_health_coach.main:app --reload --port 8000

# The app will be available at http://localhost:8000
# Login page: http://localhost:8000/login
```

On startup the app automatically:
- Creates the SQLite database and tables
- Seeds demo users (2 patients, 1 clinician)

### Demo Accounts

| User | ID | Role |
|---|---|---|
| Sarah Johnson | `patient-1` | Patient |
| Michael Chen | `patient-2` | Patient |
| Dr. Emily Rodriguez | `clinician-1` | Clinician |

Select a user on the login page to start a session.

## How to Run Tests

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run unit tests only
pytest tests/unit/

# Run integration tests only
pytest tests/integration/

# Run a specific test by name pattern
pytest -k "test_phase"
```

Tests use an in-memory SQLite database and mock LLM responses — no OpenAI key is needed for testing.

## API Endpoints

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/login` | None | Login page |
| `POST` | `/login` | None | Set session cookie (form: `user_id`, `user_type`) |
| `GET` | `/auth/me` | Session | Return current user info (JSON) |
| `POST` | `/logout` | Session | Clear session cookie |

### Patient Routes (require patient session)

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Redirect to `/chat` or `/consent` |
| `GET` | `/consent` | Consent page |
| `POST` | `/consent` | Grant or revoke consent |
| `GET` | `/onboarding` | Onboarding page with exercise program |
| `POST` | `/onboarding/goal` | Submit initial health goal |
| `GET` | `/chat` | Chat page with message history |
| `POST` | `/chat/send` | Send message to AI coach (HTMX) |
| `GET` | `/chat/messages` | Poll for new messages after timestamp |
| `GET` | `/goals` | Goals and adherence page |
| `GET` | `/settings` | Patient settings page |
| `POST` | `/settings` | Update consent settings |

### Clinician Routes (require clinician session)

| Method | Path | Description |
|---|---|---|
| `GET` | `/clinician/dashboard` | Patient list with search and stats |
| `GET` | `/clinician/patients/{patient_id}` | Patient detail, messages, phase history |
| `GET` | `/clinician/alerts` | Alerts list, filterable by severity |
| `POST` | `/clinician/alerts/{alert_id}/acknowledge` | Acknowledge an alert |
| `GET` | `/api/health` | Health check (JSON) |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FastAPI Application                    │
│                                                          │
│  ┌──────────┐  ┌───────────────┐  ┌──────────────────┐  │
│  │   Auth   │  │ Patient Routes│  │ Clinician Routes │  │
│  │ (cookies)│  │  (HTMX/HTML)  │  │   (dashboard)    │  │
│  └────┬─────┘  └───────┬───────┘  └────────┬─────────┘  │
│       │                │                    │            │
│       │         ┌──────▼──────┐             │            │
│       │         │  LangGraph  │             │            │
│       │         │ State Machine│            │            │
│       │         └──────┬──────┘             │            │
│       │                │                    │            │
│  ┌────▼────────────────▼────────────────────▼─────────┐  │
│  │              SQLAlchemy (async)                     │  │
│  │   Patient · Goal · Message · Alert · PhaseTransition│  │
│  └────────────────────┬───────────────────────────────┘  │
│                       │                                  │
│              ┌────────▼────────┐                         │
│              │  SQLite / async │                         │
│              └─────────────────┘                         │
└─────────────────────────────────────────────────────────┘
```

### Key Components

- **LangGraph State Machine** — Orchestrates the coaching conversation through 5 phases:
  `PENDING → ONBOARDING → ACTIVE ⟷ RE_ENGAGING ⟷ DORMANT`
- **Safety Classifier** — Two-layer filter (keyword scan + LLM classification) categorizing responses as SAFE, CLINICAL, or CRISIS. Blocked responses are retried with an augmented prompt, then fall back to a safe message.
- **LangChain Tools** — The coach can call tools to retrieve exercise programs, adherence metrics, set goals, create clinician alerts, and schedule reminders.
- **APScheduler** — Handles follow-up check-ins with backoff logic and dormancy detection.
- **HTMX Frontend** — Server-rendered Jinja2 templates with HTMX for live chat updates.
- **Session Auth** — Cookie-based sessions signed with `itsdangerous` for demo use.
