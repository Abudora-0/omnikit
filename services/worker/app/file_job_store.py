import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.storage_paths import storage_root


def _storage_root() -> Path:
    return storage_root()


def jobs_dir() -> Path:
    path = _storage_root() / "jobs"
    path.mkdir(parents=True, exist_ok=True)
    return path


def queue_dir() -> Path:
    path = _storage_root() / "queue"
    path.mkdir(parents=True, exist_ok=True)
    return path


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_job(job_id: str) -> dict[str, Any] | None:
    job_path = jobs_dir() / f"{job_id}.json"
    if not job_path.exists():
        return None
    return json.loads(job_path.read_text(encoding="utf-8"))


def update_job(job_id: str, **updates: Any) -> dict[str, Any] | None:
    job = get_job(job_id)
    if not job:
        return None

    job.update(updates)
    job["updatedAt"] = _now()
    job_path = jobs_dir() / f"{job_id}.json"
    job_path.write_text(json.dumps(job), encoding="utf-8")
    return job


def dequeue_file_job(timeout: int = 5) -> dict[str, Any] | None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        queue = queue_dir()
        candidates = list(queue.glob("*.json"))
        if candidates:
            item_path = min(candidates, key=lambda p: p.stat().st_mtime)
            payload = json.loads(item_path.read_text(encoding="utf-8"))
            item_path.unlink(missing_ok=True)
            return payload
        time.sleep(0.5)
    return None
