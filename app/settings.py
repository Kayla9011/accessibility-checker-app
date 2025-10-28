import os
API_NAME = "backend-b-analyzer"
PORT = int(os.getenv("PORT", "8000")) 
NODE_BIN = os.getenv("NODE_BIN", "node")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
