from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services import user_service

router = APIRouter(prefix="/users", tags=["users"])


class UserUpdate(BaseModel):
    full_name: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return user_service._public(current_user)


@router.patch("/me")
async def update_me(
    body: UserUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await user_service.update_me(current_user.id, body.full_name, session)


@router.patch("/me/password", status_code=204)
async def change_password(
    body: PasswordChange,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    await user_service.change_password(
        current_user.id, body.current_password, body.new_password, session
    )


@router.get("/me/transactions")
async def get_my_transactions(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await user_service.get_my_transactions(current_user.id, session)


@router.get("/{user_id}")
async def get_user(user_id: int, session: AsyncSession = Depends(get_session)):
    return await user_service.get_user(user_id, session)
