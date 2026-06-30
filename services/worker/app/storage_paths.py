from pathlib import Path

from app.config import settings


def storage_root() -> Path:
    configured = Path(settings.storage_dir)
    if configured.is_absolute():
        root = configured
    else:
        root = (Path(__file__).resolve().parents[1] / configured).resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


def results_dir() -> Path:
    path = storage_root() / "results"
    path.mkdir(parents=True, exist_ok=True)
    return path


def uploads_dir() -> Path:
    path = storage_root() / "uploads"
    path.mkdir(parents=True, exist_ok=True)
    return path
