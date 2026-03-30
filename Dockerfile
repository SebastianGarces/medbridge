FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml uv.lock ./
COPY src/ src/
COPY data/ data/

RUN pip install --no-cache-dir -e .

CMD ["uvicorn", "ai_health_coach.main:app", "--host", "0.0.0.0", "--port", "8000"]
