# === Stage 1: Builder ===
FROM python:3.10-slim as builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libffi-dev python3-dev libssl-dev curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install --no-cache-dir poetry

# Copy dependency files first to leverage cache
COPY pyproject.toml poetry.lock* ./

# Configure poetry to not use virtualenv
RUN poetry config virtualenvs.create false

# Install project dependencies only (no dev deps)
RUN poetry install --no-root --only main

# === Stage 2: Runtime ===
FROM python:3.10-slim

# Set working directory
WORKDIR /whoisspeaking

# Install only runtime dependencies (no compilers)
RUN apt-get update && apt-get install -y --no-install-recommends \
    supervisor \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy installed site-packages from builder
COPY --from=builder /usr/local/lib/python3.10 /usr/local/lib/python3.10
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application source code
COPY . .

# Copy Supervisor configuration
COPY supervisord.conf /etc/supervisord.conf

# Expose FastAPI port
EXPOSE 8000

# Run Supervisor to manage FastAPI & Celery
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
