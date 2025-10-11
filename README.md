# Backend B – Accessibility Analyzer
A stand-alone FastAPI module that perfors web accessibility analysis using **Playwright**, **Lighthouse**, and **axe-core**.
It accepts a target URL or raw HTML, executes and automated accessibility audit, calculates a score, applies rule-based caps, and returns normalized JSON results ready for integration with the full system *(Backend A → Backend B → Backend C → Frontend)*.


## Setup & Run (Local Environment)
### Intall Node worker dependencies
```bash
cd worker && npm i && cd ..
```

### Intall Python dependencies
```bash
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Run the FastAPI server
```bash
uvicorn app.main:app --reload --port 8001
#Open swagger: http://localhost:8001/docs
```

## Run Tests
```bash
pytest -q
```

## Environment Notes
| Variable   | Description                          | Default |
| ---------- | ------------------------------------ | ------- |
| `PORT`     | Server port                          | `8001`  |
| `NODE_BIN` | Path to Node binary (if not in PATH) | `node`  |

## Depolyment Notes
- Can run locally or inside Docker.
- Designed to be containerized independently (for scaling audits).
- To integrate with Frontend or Backend A/C: expose only the two routes above.
- Future expansion: swap in Redis for storage.py and enable job queue.