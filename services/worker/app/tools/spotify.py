import subprocess
import sys
from pathlib import Path

from app.storage_paths import results_dir


def _run_command(cmd: list[str]) -> None:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        detail = (result.stderr or result.stdout or "Unknown error").strip()
        raise RuntimeError(detail[:500])


def download_spotify(url: str, format_type: str = "mp3") -> tuple[str, str, str]:
    output_dir = results_dir()

    before = {p.name for p in output_dir.glob("*") if p.is_file()}

    # Invoke spotdl as a module via the worker's own interpreter — the spotdl.exe
    # script dir is often not on PATH on Windows (would raise WinError 2).
    cmd = [
        sys.executable,
        "-m",
        "spotdl",
        url,
        "--output",
        str(output_dir),
        "--format",
        format_type,
    ]

    _run_command(cmd)

    after = {p.name for p in output_dir.glob("*") if p.is_file()}
    new_files = sorted(after - before)
    if not new_files:
        raise RuntimeError("Spotify download finished but no output file was found")

    latest = Path(output_dir / new_files[-1])
    mime = "audio/flac" if format_type == "flac" else "audio/mpeg"
    return str(latest), latest.name, mime
