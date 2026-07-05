import os
import secrets

from fastapi import HTTPException, Request


def require_admin_key(request: Request) -> None:
    configured_key = os.getenv("STATS_API_KEY", "").strip()
    if not configured_key:
        raise HTTPException(status_code=404, detail="Not found")

    provided = request.headers.get("X-Stats-Key", "")
    if not secrets.compare_digest(provided.strip(), configured_key):
        raise HTTPException(status_code=403, detail="Forbidden")
