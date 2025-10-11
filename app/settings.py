# app/settings.py
import os

API_NAME = "backend-b-analyzer"
PORT = int(os.getenv("PORT", "8001"))
NODE_BIN = os.getenv("NODE_BIN", "node")  # allow overriding node path via env
