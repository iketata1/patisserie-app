FROM python:3.11-slim

ENV PIP_NO_CACHE_DIR=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DEFAULT_TIMEOUT=1000

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends git curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN python -m pip install --upgrade pip
# ↓ PyTorch CPU (léger, pas de CUDA)
RUN pip install torch==2.4.1+cpu --extra-index-url https://download.pytorch.org/whl/cpu
RUN pip install -r requirements.txt

COPY . .
RUN mkdir -p /app/data

ENV PORT=8089
EXPOSE 8089
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8089"]
