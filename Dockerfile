# ---- Matrix Mentor: FastAPI backend image ----
FROM python:3.12-slim

# No .pyc files, and logs appear immediately in `docker logs`
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies first so Docker can cache this layer
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# main.py reads ../context.md, so keep this layout: /app/backend + /app/context.md
COPY backend/ ./backend/
COPY context.md ./context.md

# Run as a non-root user
RUN useradd --system --no-create-home appuser
USER appuser

WORKDIR /app/backend

EXPOSE 8000

# Secrets (HF_TOKEN, DATABASE_URL) are NOT baked in; pass them at runtime
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
