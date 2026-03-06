#!/bin/bash
export MONGO_URL="mongodb+srv://kribean_db_user:csCjFDK8i24KOfSG@cluster0.yllddco.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority"
export DB_NAME="loop"
export JWT_SECRET="loop_jwt_secret_change_in_production"
export STRIPE_SECRET_KEY="sk_test_51M2fZlJaOgMZUcVV8Y8cbKMep93xpfAPjqrvs3pFe3wXJ2JEeIiGbzhP9txZ41KOsop0yQWgNGMeXjM4GRkzWCSk00RZNsYcFn"
export STRIPE_PUBLISHABLE_KEY="pk_test_51M2fZlJaOgMZUcVV9NVs3L4yqz5QQeFsz6ySwl5MEkMeCnXxKnIS78Kk7QKCr6qPwGlj7vP85dvnZwz5Pf12tSM000bRfoA4ol"

# Gemini API Key for AI-based CO2 estimation (get from https://aistudio.google.com/app/apikey)
# Without this key, only ADEME category-based estimates will be used
export GEMINI_API_KEY="***REMOVED***"

# Kill existing process
lsof -ti:8000 | xargs kill -9 2>/dev/null
sleep 2

# Activate venv and start server
source venv/bin/activate
python3 server.py
