#!/bin/bash
# Secrets have been moved to .env for security.
# Ensure your .env file is populated with SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET, STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, GEMINI_API_KEY

# Kill existing process
lsof -ti:8000 | xargs kill -9 2>/dev/null
sleep 2

# Activate venv and start server
source ../.venv/bin/activate
python3 server.py
