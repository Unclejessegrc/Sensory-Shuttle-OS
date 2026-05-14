# Minimal noop FastAPI app — backend persistence for Sensory Shuttle OS
# is handled by Supabase. This stub keeps the Emergent supervisor happy.
from fastapi import FastAPI

app = FastAPI(title="Sensory Shuttle OS — supervisor stub")


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "supervisor-stub"}
