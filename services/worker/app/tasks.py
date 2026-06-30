import shutil
from pathlib import Path

from app.file_job_store import update_job as update_file_job
from app.job_store import update_job as update_redis_job
from app.storage_paths import results_dir

# Tool handlers are imported lazily inside process_job() so that a heavy/broken dependency
# in one tool (e.g. rembg/numba for bg-remove) can't prevent the worker from starting or
# block unrelated tools (video/spotify downloads).


def _store_result(job_id: str, source_path: str, filename: str) -> str:
    target = results_dir() / f"{job_id}-{filename}"
    source = Path(source_path)
    if source.resolve() != target.resolve():
        shutil.move(str(source), str(target))
    return filename


def _set_status(job_id: str, use_file: bool, **updates):
    if use_file:
        return update_file_job(job_id, **updates)
    return update_redis_job(job_id, **updates)


def process_job(job_id: str, tool_id: str, payload: dict, use_file: bool = False) -> None:
    _set_status(job_id, use_file, status="processing", progress=10, message="Starting...")

    try:
        if tool_id == "bg-remove":
            from app.tools.bg_remove import remove_background

            _set_status(job_id, use_file, progress=30, message="Removing background...")
            input_path = str(payload.get("file", ""))
            model = str(payload.get("model", "u2net"))
            output_path, filename = remove_background(input_path, model)
            final_name = _store_result(job_id, output_path, filename)
            mime_map = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}
            ext = Path(filename).suffix.lower()
            _set_status(
                job_id,
                use_file,
                status="completed",
                progress=100,
                message="Background removed",
                resultFilename=final_name,
                resultMimeType=mime_map.get(ext, "image/png"),
            )
            return

        if tool_id in ("video-download", "youtube-download", "instagram-download", "tiktok-download", "twitter-download", "mp3-download"):
            from app.tools.video import download_video

            _set_status(job_id, use_file, progress=20, message="Fetching media info...")
            url = str(payload.get("url", ""))
            format_type = str(payload.get("format", "mp4"))
            quality = str(payload.get("quality", "best"))
            _set_status(job_id, use_file, progress=40, message="Downloading...")

            def _on_progress(pct: int, message: str) -> None:
                _set_status(job_id, use_file, progress=min(95, max(40, pct)), message=message)

            output_path, filename, mime = download_video(url, format_type, quality, on_progress=_on_progress)
            final_name = _store_result(job_id, output_path, filename)
            _set_status(
                job_id,
                use_file,
                status="completed",
                progress=100,
                message="Download complete",
                resultFilename=final_name,
                resultMimeType=mime,
            )
            return

        if tool_id == "spotify-download":
            from app.tools.spotify import download_spotify

            _set_status(job_id, use_file, progress=20, message="Resolving Spotify link...")
            url = str(payload.get("url", ""))
            format_type = str(payload.get("format", "mp3"))
            _set_status(job_id, use_file, progress=40, message="Downloading audio...")
            output_path, filename, mime = download_spotify(url, format_type)
            final_name = _store_result(job_id, output_path, filename)
            _set_status(
                job_id,
                use_file,
                status="completed",
                progress=100,
                message="Spotify download complete",
                resultFilename=final_name,
                resultMimeType=mime,
            )
            return

        raise ValueError(f"Unsupported tool: {tool_id}")
    except Exception as exc:  # noqa: BLE001
        _set_status(
            job_id,
            use_file,
            status="failed",
            progress=100,
            message="Job failed",
            error=str(exc),
        )
