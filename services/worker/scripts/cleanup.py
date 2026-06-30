#!/usr/bin/env python3
"""Remove expired uploads and results from storage."""

from __future__ import annotations

import os
import time
from pathlib import Path

from app.config import settings


def cleanup_expired_files() -> int:
    ttl_hours = int(os.getenv("JOB_TTL_HOURS", settings.job_ttl_hours))
    cutoff = time.time() - ttl_hours * 60 * 60
    removed = 0
    base = Path(settings.storage_dir)

    for subdir in ("uploads", "results"):
        target = base / subdir
        if not target.exists():
            continue
        for path in target.iterdir():
            if not path.is_file():
                continue
            if path.stat().st_mtime < cutoff:
                path.unlink(missing_ok=True)
                removed += 1

    return removed


if __name__ == "__main__":
    count = cleanup_expired_files()
    print(f"Removed {count} expired file(s)")
