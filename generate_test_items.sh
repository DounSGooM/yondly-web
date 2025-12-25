#!/bin/bash

# Script to generate test items around a location
# Usage: ./generate_test_items.sh [lat] [lng] [count] [radius]

# Default values (Paris center)
LAT=${1:-48.8566}
LNG=${2:-2.3522}
COUNT=${3:-50}
RADIUS=${4:-5}

echo "🌍 Generating $COUNT test items around ($LAT, $LNG) within ${RADIUS}km radius..."

cd backend

# Set MongoDB environment variables
export MONGO_URL="mongodb+srv://kribean_db_user:csCjFDK8i24KOfSG@cluster0.yllddco.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority"
export DB_NAME="loop"

# Activate virtual environment and run script
source venv/bin/activate
python seed_test_items_mongo.py --lat $LAT --lng $LNG --count $COUNT --radius $RADIUS

echo ""
echo "✅ Done! Test the API:"
echo "curl \"http://192.168.1.190:8000/api/items?lat=$LAT&lng=$LNG&limit=10\""
