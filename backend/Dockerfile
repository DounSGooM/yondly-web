FROM python:3.11-slim-bullseye

WORKDIR /app

# Install system dependencies including CA certificates for SSL/TLS
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libjpeg-dev \
    zlib1g-dev \
    ca-certificates \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# PORT is set by the hosting platform (Railway, Cloud Run, etc.)
ENV PORT=8000
EXPOSE $PORT

CMD ["python", "server.py"]
