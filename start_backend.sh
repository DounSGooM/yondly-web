#!/bin/bash
cd backend
# Install dependencies if needed (optional, uncomment if you want to auto-install)
# pip install -r requirements.txt

# Start the server
# Reload allows auto-restart on code changes
echo "Starting backend server on http://localhost:8000..."
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Secrets should be loaded from backend/.env

python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000