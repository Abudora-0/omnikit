FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# yt-dlp needs a JS runtime to solve YouTube's "n" challenge (anti-bot token);
# without it, only storyboard/thumbnail formats are returned, no real video/audio.
ENV DENO_INSTALL=/usr/local
RUN curl -fsSL https://deno.land/install.sh | sh

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY worker.py .

RUN mkdir -p /data/storage

ENV STORAGE_DIR=/data/storage
ENV REDIS_URL=redis://redis:6379/0

CMD ["python", "worker.py"]
