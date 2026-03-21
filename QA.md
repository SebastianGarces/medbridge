# QA — Manual Testing Checklist

## Prerequisites

- Application running locally (`uvicorn ai_health_coach.main:app --reload --port 8000`)
- Valid `OPENAI_API_KEY` in `.env` for LLM-dependent flows
- All tests passing (`pytest`)

## Test Accounts

| User | ID | Role | Login |
|---|---|---|---|
| Sarah Johnson | `patient-1` | Patient | Select on login page |
| Michael Chen | `patient-2` | Patient | Select on login page |
| Dr. Emily Rodriguez | `clinician-1` | Clinician | Select on login page |

Demo users are seeded automatically on startup.

---

## Manual Testing Scenarios

### 1. Authentication

- [ ] **Login page renders** — Navigate to `/login`. Expect a page listing demo patients and clinician.
- [ ] **Patient login** — Select "Sarah Johnson" and submit. Expect redirect to `/consent` (first visit) or `/chat` (if consent already granted).
- [ ] **Clinician login** — Select "Dr. Emily Rodriguez" and submit. Expect redirect to `/clinician/dashboard`.
- [ ] **Auth guard** — While logged out, navigate to `/chat`. Expect redirect to `/login`.
- [ ] **Logout** — Click logout. Expect redirect to `/login` and session cookie cleared.

### 2. Consent Flow

- [ ] **Consent page renders** — After patient login, consent page is displayed.
- [ ] **Grant consent** — Submit the consent form. Expect phase transition from PENDING to ONBOARDING and redirect to `/onboarding`.
- [ ] **Revoke consent** — On settings page, revoke consent. Expect access to chat to be blocked.

### 3. Onboarding

- [ ] **Onboarding page renders** — Shows exercise program and goal input.
- [ ] **Submit goal** — Enter a health goal (e.g., "Reduce knee pain"). Expect AI to acknowledge the goal and transition to ACTIVE phase.
- [ ] **Goal extraction** — The AI should extract and confirm the goal, storing it in the database.

### 4. Active Chat

- [ ] **Chat page renders** — Shows message history and input form.
- [ ] **Send message** — Type a message (e.g., "How should I warm up?"). Expect an AI coach response within a few seconds.
- [ ] **Message persistence** — Refresh the page. Previous messages should still appear.
- [ ] **Message polling** — Open a second tab; messages sent in one tab should appear in the other via polling.

### 5. Safety Classification

- [ ] **Safe message** — Send "What stretches should I do?" Expect a normal coaching response.
- [ ] **Clinical content** — Send "Can you diagnose my condition?" Expect the coach to redirect to a clinician rather than providing medical advice.
- [ ] **Crisis content** — Send a message with crisis keywords. Expect a safety fallback message and alert created for clinician.

### 6. Clinician Dashboard

- [ ] **Dashboard renders** — Login as clinician. Expect patient list with names, phases, and stats.
- [ ] **Patient search** — Use search functionality to filter patients.
- [ ] **Patient detail** — Click a patient. Expect to see their message history and phase transitions.
- [ ] **Alerts page** — Navigate to alerts. Expect list of alerts (if any) with severity indicators.
- [ ] **Acknowledge alert** — Click acknowledge on an alert. Expect it to be marked as acknowledged.

### 7. Phase Transitions

- [ ] **ACTIVE → RE_ENGAGING** — After 3 unanswered check-ins, patient should move to RE_ENGAGING phase. (Requires scheduler or manual DB manipulation.)
- [ ] **RE_ENGAGING → ACTIVE** — Send a message while in RE_ENGAGING. Expect transition back to ACTIVE.
- [ ] **RE_ENGAGING → DORMANT** — 3 more unanswered check-ins in RE_ENGAGING. Expect transition to DORMANT.
- [ ] **DORMANT → ACTIVE** — Send a message while in DORMANT. Expect warm welcome and transition to ACTIVE.

### 8. Goals & Settings

- [ ] **Goals page** — Navigate to `/goals`. Expect to see current goal and adherence data.
- [ ] **Settings page** — Navigate to `/settings`. Expect consent management options.

### 9. Health Check

- [ ] **API health** — `GET /api/health` returns JSON `200 OK`.

---

## Known Limitations

- **Demo auth only** — Authentication uses signed cookies with demo users. There is no user registration, password-based auth, or OAuth. Not suitable for production without a real auth layer.
- **SQLite default** — The default database is a local SQLite file (`coach.db`). For production, configure `DATABASE_URL` to point to PostgreSQL or another production database.
- **No real exercise data** — Exercise programs and adherence metrics are stubbed/mocked in the tool implementations. Integration with a real clinical data source is needed.
- **Scheduler requires long-running process** — APScheduler follow-ups only fire while the server is running. Scheduled check-ins are lost on restart.
- **No WebSocket support** — Chat uses HTMX polling, not real-time WebSocket connections.
- **Single-tenant** — No multi-tenancy or organization-level isolation.

## Auto-Generated vs. Needs Human Attention

### Auto-Generated (complete)
- Database models and migrations (auto-create on startup)
- LangGraph state machine with all 5 phases
- Two-layer safety classifier
- HTMX-based patient chat interface
- Clinician dashboard with alerts
- Consent management flow
- Full test suite (unit + integration)

### Needs Human Attention
- **OpenAI API key** — Must be provided in `.env` for LLM features to work
- **Production auth** — Replace demo cookie auth with a proper identity provider
- **Exercise program data** — Connect to real clinical data instead of stubs
- **Production database** — Switch from SQLite to PostgreSQL for deployment
- **SECRET_KEY** — Generate a strong random key for production
- **HTTPS / CORS** — Configure for production deployment
- **Scheduler persistence** — Use a persistent job store for APScheduler
- **Load testing** — Verify performance under concurrent users
