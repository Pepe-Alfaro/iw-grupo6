import uuid
from pathlib import Path

import aiofiles
from fastapi import HTTPException, UploadFile

from app.core.config import settings

_ALLOWED: dict[bytes, str] = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"GIF87a": "image/gif",
    b"GIF89a": "image/gif",
}
_MAX_BYTES = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024


def _detect_mime(header: bytes) -> str | None:
    for magic, mime in _ALLOWED.items():
        if header[: len(magic)] == magic:
            return mime
    # WebP: RIFF....WEBP
    if header[:4] == b"RIFF" and header[8:12] == b"WEBP":
        return "image/webp"
    return None


async def save_upload(file: UploadFile, upload_dir: Path) -> str:
    header = await file.read(12)
    mime = _detect_mime(header)
    if mime is None:
        raise HTTPException(
            status_code=400,
            detail="Formato no permitido. Usa JPEG, PNG, GIF o WebP",
        )

    rest = await file.read()
    total = len(header) + len(rest)
    if total > _MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"La imagen supera el tamaño máximo de {settings.MAX_IMAGE_SIZE_MB} MB",
        )

    ext = mime.split("/")[1].replace("jpeg", "jpg")
    filename = f"{uuid.uuid4().hex}.{ext}"
    dest = upload_dir / filename
    upload_dir.mkdir(parents=True, exist_ok=True)

    async with aiofiles.open(dest, "wb") as f:
        await f.write(header + rest)

    return filename
