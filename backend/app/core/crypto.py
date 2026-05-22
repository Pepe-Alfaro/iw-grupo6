import base64
import os
from hashlib import sha256

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import settings

_PREFIX = "enc:"


def _key() -> bytes:
    return sha256(settings.SECRET_KEY.encode()).digest()


def encrypt(plaintext: str) -> str:
    nonce = os.urandom(12)
    ciphertext = AESGCM(_key()).encrypt(nonce, plaintext.encode(), None)
    return _PREFIX + base64.b64encode(nonce + ciphertext).decode()


def decrypt(stored: str) -> str:
    if not stored.startswith(_PREFIX):
        return stored
    data = base64.b64decode(stored[len(_PREFIX) :])
    nonce, ciphertext = data[:12], data[12:]
    return AESGCM(_key()).decrypt(nonce, ciphertext, None).decode()
