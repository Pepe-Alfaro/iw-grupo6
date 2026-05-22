from fastapi import HTTPException
from sqlalchemy import select as sa_select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserRole


async def register(
    email: str, username: str, password: str, full_name: str, session: AsyncSession
) -> dict:
    existing = (
        await session.execute(
            sa_select(User).where((User.email == email) | (User.username == username))
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Email o username ya registrado")

    user = User(
        email=email,
        username=username,
        hashed_password=hash_password(password),
        full_name=full_name,
        role=UserRole.CLIENT,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return {"access_token": create_access_token(user.id), "token_type": "bearer"}


async def login(email: str, password: str, session: AsyncSession) -> dict:
    user = (await session.execute(sa_select(User).where(User.email == email))).scalar_one_or_none()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Cuenta desactivada")
    return {"access_token": create_access_token(user.id), "token_type": "bearer"}
