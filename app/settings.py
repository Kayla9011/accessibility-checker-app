import os
API_NAME = "backend-b-analyzer"
PORT = int(os.getenv("PORT", "8000")) 
NODE_BIN = os.getenv("NODE_BIN", "node")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
import os

API_NAME = "backend-b-analyzer"
PORT = int(os.getenv("PORT", "8000"))

# Node worker
NODE_BIN = os.getenv("NODE_BIN", "node")
NODE_TIMEOUT_SEC = int(os.getenv("NODE_TIMEOUT_SEC", "120"))

# Do NOT silently fall back to mock in dev
ALLOW_MOCK_FALLBACK = os.getenv("ALLOW_MOCK_FALLBACK", "false").lower() in {"1","true","yes"}

# CORS
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
