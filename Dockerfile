FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml uv.lock ./
COPY src/ src/
COPY data/ data/

RUN pip install --no-cache-dir -e .

CMD sh -c "uvicorn ai_health_coach.main:app --host 0.0.0.0 --port ${PORT:-8000}"
