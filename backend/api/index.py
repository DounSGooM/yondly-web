import sys
import os

# Add the parent directory (backend/) to sys.path so we can import server.py and other modules
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from server import app

# Vercel expects a variable named 'app' or 'handler'
# We already imported 'app' from server.py
