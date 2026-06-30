from pathlib import Path

from PIL import Image
from rembg import remove, new_session

from app.storage_paths import results_dir

_ALLOWED_MODELS = {"u2net", "isnet-general-use"}


def remove_background(input_path: str, model: str = "u2net") -> tuple[str, str]:
    if model not in _ALLOWED_MODELS:
        model = "u2net"

    session = new_session(model)
    with Image.open(input_path) as image:
        output = remove(image, session=session)

    input_ext = Path(input_path).suffix.lower()
    if input_ext in (".jpg", ".jpeg"):
        save_format = "JPEG"
        ext = ".jpg"
    elif input_ext == ".webp":
        save_format = "WEBP"
        ext = ".webp"
    else:
        save_format = "PNG"
        ext = ".png"

    filename = f"{Path(input_path).stem}-nobg{ext}"
    output_path = results_dir() / filename
    output.save(output_path, format=save_format)
    return str(output_path), filename
