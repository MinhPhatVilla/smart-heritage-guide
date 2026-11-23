# =============================================================================
# Smart Heritage Guide Backend — Multi-Stage Slim Python 3.12 Dockerfile
# =============================================================================
FROM python:3.12-slim AS builder

WORKDIR /build

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

COPY requirements.txt .
RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --upgrade pip \
    && /opt/venv/bin/pip install -r requirements.txt

FROM python:3.12-slim AS runtime

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    PORT=8000 \
    TTS_DEFAULT_PROVIDER=auto \
    TTS_AUTO_DOWNLOAD_OFFLINE=true \
    TTS_PRELOAD_OFFLINE_LANGS=vi

# Runtime shared libs required by onnxruntime / piper-tts / sherpa-onnx on slim Debian
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/venv /opt/venv
COPY app ./app
COPY scripts ./scripts
COPY supabase ./supabase
COPY .env.example ./.env.example

RUN mkdir -p /app/uploads /app/models/tts

# Đóng gói sẵn model giọng Việt Open-Source ONNX ngay trong Docker image khi deploy (Render/Railway/Docker)
ARG PRELOAD_TTS_LANGS=vi
RUN if [ -n "$PRELOAD_TTS_LANGS" ]; then \
      python -c "from app.services.tts_service import preload_offline_models_sync; preload_offline_models_sync('$PRELOAD_TTS_LANGS')" || true; \
    fi

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health')" || exit 1

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
