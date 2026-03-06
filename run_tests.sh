#!/bin/bash
cd backend
if [ -d "venv" ]; then
    source venv/bin/activate
fi
cd ..
python3 backend_test.py
