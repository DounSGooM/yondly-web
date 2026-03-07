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

# Cloud Run sets PORT=8080
ENV PORT=8080
EXPOSE 8080

CMD ["python", "server.py"]
