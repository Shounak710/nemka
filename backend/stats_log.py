import hashlib
import json
import os
from collections import Counter
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from .geo_service import is_local_ip, lookup_country

_DEFAULT_LOG_DIR = Path(__file__).resolve().parent / "logs"
LOG_DIR = Path(os.environ["LOG_DIR"]) if os.getenv("LOG_DIR") else _DEFAULT_LOG_DIR
STATS_LOG_PATH = LOG_DIR / "stats.jsonl"
_USER_HASH_SALT = "nemka-aggregate-stats-v1"


def _append_jsonl(path: Path, entry: dict) -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(entry, ensure_ascii=False) + "\n")


def user_hash_from_ip(ip: str) -> str:
    digest = hashlib.sha256(f"{_USER_HASH_SALT}:{ip}".encode()).hexdigest()
    return digest[:16]


def destination_from_result(result: dict) -> str:
    if result.get("source") == "stackoverflow":
        return "stackoverflow"
    return result.get("route", "search")


def log_request_stat(
    *,
    ip: str,
    country_hint: str | None,
    endpoint: str,
    result: dict,
    latency_ms: float,
    query_logged: bool,
) -> None:
    if country_hint:
        country = country_hint
    elif is_local_ip(ip) or ip == "unknown":
        country = "local"
    else:
        country = lookup_country(ip)

    now = datetime.now(timezone.utc)
    entry = {
        "timestamp": now.isoformat(),
        "date": now.date().isoformat(),
        "user_hash": user_hash_from_ip(ip),
        "endpoint": endpoint,
        "destination": destination_from_result(result),
        "route": result["route"],
        "source": result["source"],
        "latency_ms": round(latency_ms, 2),
        "country": country,
        "query_logged": query_logged,
    }
    _append_jsonl(STATS_LOG_PATH, entry)


def summarize_stats(days: int = 30) -> dict:
    if not STATS_LOG_PATH.exists():
        return {
            "total_requests": 0,
            "unique_users": 0,
            "avg_latency_ms": 0.0,
            "destination_pct": {},
            "requests_by_day": [],
            "requests_by_country": {},
        }

    cutoff = date.today() - timedelta(days=max(days - 1, 0))
    total_requests = 0
    users: set[str] = set()
    latency_total = 0.0
    destinations: Counter[str] = Counter()
    by_day: Counter[str] = Counter()
    by_country: Counter[str] = Counter()

    for line in STATS_LOG_PATH.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        entry = json.loads(line)
        entry_date = date.fromisoformat(entry["date"])
        if entry_date < cutoff:
            continue

        total_requests += 1
        users.add(entry["user_hash"])
        latency_total += float(entry.get("latency_ms", 0))
        destinations[entry.get("destination", "search")] += 1
        by_day[entry["date"]] += 1
        by_country[entry.get("country", "unknown")] += 1

    destination_pct = {}
    if total_requests:
        destination_pct = {
            key: round(count / total_requests * 100, 2)
            for key, count in destinations.items()
        }

    requests_by_day = [
        {"date": day, "requests": by_day[day]}
        for day in sorted(by_day)
    ]

    return {
        "total_requests": total_requests,
        "unique_users": len(users),
        "avg_latency_ms": round(latency_total / total_requests, 2) if total_requests else 0.0,
        "destination_pct": destination_pct,
        "requests_by_day": requests_by_day,
        "requests_by_country": dict(
            sorted(by_country.items(), key=lambda item: item[1], reverse=True)
        ),
    }
