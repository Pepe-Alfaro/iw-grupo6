from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.core.dependencies import require_moderator
from app.models.user import User
from app.services import moderation_service

router = APIRouter(prefix="/moderation", tags=["moderation"])


class AlertResolve(BaseModel):
    resolution: str  # "approved" | "rejected"


@router.get("/alerts")
async def list_alerts(
    session: AsyncSession = Depends(get_session),
    _mod: User = Depends(require_moderator),
):
    return await moderation_service.list_alerts(session)


@router.patch("/alerts/{alert_id}")
async def resolve_alert(
    alert_id: int,
    body: AlertResolve,
    session: AsyncSession = Depends(get_session),
    mod: User = Depends(require_moderator),
):
    return await moderation_service.resolve_alert(alert_id, body.resolution, mod.id, session)


@router.get("/products")
async def list_all_products(
    session: AsyncSession = Depends(get_session),
    _mod: User = Depends(require_moderator),
):
    return await moderation_service.list_all_products(session)


@router.delete("/products/{product_id}", status_code=204)
async def remove_product(
    product_id: int,
    session: AsyncSession = Depends(get_session),
    _mod: User = Depends(require_moderator),
):
    await moderation_service.remove_product(product_id, session)


@router.get("/reports")
async def list_reports(
    session: AsyncSession = Depends(get_session),
    _mod: User = Depends(require_moderator),
):
    return await moderation_service.list_reports(session)


@router.patch("/reports/{report_id}/review", status_code=204)
async def review_report(
    report_id: int,
    session: AsyncSession = Depends(get_session),
    _mod: User = Depends(require_moderator),
):
    await moderation_service.mark_report_reviewed(report_id, session)
