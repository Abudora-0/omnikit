"""Locate ffmpeg and make it discoverable by yt-dlp / spotdl.

Both tools auto-detect ffmpeg from PATH, so injecting its directory into the
worker process environment fixes both at once — without a system-level PATH
change (which is fragile and breaks on every ffmpeg version bump). On Windows,
winget's Gyan.FFmpeg package installs ffmpeg but often does not add it to PATH.
"""

import glob
import os
import shutil
from typing import Optional


def _candidate_paths() -> list[str]:
    candidates: list[str] = []

    local = os.environ.get("LOCALAPPDATA", "")
    if local:
        # winget (Gyan.FFmpeg) — version dir varies, so glob it.
        candidates += glob.glob(
            os.path.join(
                local, "Microsoft", "WinGet", "Packages",
                "Gyan.FFmpeg*", "**", "bin", "ffmpeg.exe",
            ),
            recursive=True,
        )

    program_data = os.environ.get("ProgramData", "")
    userprofile = os.environ.get("USERPROFILE", "")
    candidates += [
        r"C:\ffmpeg\bin\ffmpeg.exe",
        os.path.join(program_data, "chocolatey", "bin", "ffmpeg.exe") if program_data else "",
        os.path.join(userprofile, "scoop", "shims", "ffmpeg.exe") if userprofile else "",
    ]
    return [c for c in candidates if c]


def ensure_ffmpeg_on_path() -> Optional[str]:
    """Ensure ffmpeg is on PATH for this process. Returns its bin dir, or None."""
    existing = shutil.which("ffmpeg")
    if existing:
        return os.path.dirname(existing)

    for path in _candidate_paths():
        if os.path.isfile(path):
            bin_dir = os.path.dirname(path)
            os.environ["PATH"] = bin_dir + os.pathsep + os.environ.get("PATH", "")
            return bin_dir

    return None
