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
if [ -z "$MONGO_URL" ]; then
    export MONGO_URL="mongodb+srv://kribean_db_user:csCjFDK8i24KOfSG@cluster0.yllddco.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority"
fi
if [ -z "$DB_NAME" ]; then
    export DB_NAME="loop"
fi
# Google Cloud Vision API Key
export GOOGLE_CLOUD_VISION_API_KEY="***REMOVED***"

python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000