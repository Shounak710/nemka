import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

_DEFAULT_LOG_DIR = Path(__file__).resolve().parent / "logs"
LOG_DIR = Path(os.environ["LOG_DIR"]) if os.getenv("LOG_DIR") else _DEFAULT_LOG_DIR
CLASSIFICATION_LOG_PATH = LOG_DIR / "queries.jsonl"
FEEDBACK_LOG_PATH = LOG_DIR / "feedback.jsonl"


def _append_jsonl(path: Path, entry: dict) -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def log_classification(query: str, result: dict) -> str:
    log_id = str(uuid.uuid4())
    entry = {
        "log_id": log_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "query": query,
        "route": result["route"],
        "source": result["source"],
    }

    if "confidence" in result:
        entry["confidence"] = result["confidence"]
    if "reason" in result:
        entry["reason"] = result["reason"]
    if "redirect_url" in result:
        entry["redirect_url"] = result["redirect_url"]
    if "stackoverflow_title" in result:
        entry["stackoverflow_title"] = result["stackoverflow_title"]
    if "stackoverflow_score" in result:
        entry["stackoverflow_score"] = result["stackoverflow_score"]
    if "stackoverflow_accepted" in result:
        entry["stackoverflow_accepted"] = result["stackoverflow_accepted"]

    _append_jsonl(CLASSIFICATION_LOG_PATH, entry)
    return log_id


def update_log_preference(log_id: str, useful_route: str) -> bool:
    if not CLASSIFICATION_LOG_PATH.exists():
        return False

    lines = CLASSIFICATION_LOG_PATH.read_text(encoding="utf-8").splitlines()
    updated = False
    new_lines = []

    for line in lines:
        if not line.strip():
            continue
        entry = json.loads(line)
        if entry.get("log_id") == log_id:
            entry["useful_route"] = useful_route
            entry["useful_route_at"] = datetime.now(timezone.utc).isoformat()
            updated = True
        new_lines.append(json.dumps(entry, ensure_ascii=False))

    if updated:
        CLASSIFICATION_LOG_PATH.write_text(
            "\n".join(new_lines) + ("\n" if new_lines else ""),
            encoding="utf-8",
        )

    return updated


def log_feedback(feedback: dict) -> None:
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **feedback,
    }
    _append_jsonl(FEEDBACK_LOG_PATH, entry)
