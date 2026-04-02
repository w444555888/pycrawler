from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_session
from app.models.user import User
from app.services.auth_service import verify_token
from app.services.subscribe_service import SubscribeService
from app.utils.response import success

router = APIRouter(tags=["subscribe"])


@router.post("")
async def add_subscribe(data: dict, session: AsyncSession = Depends(get_session)):
    """新增 Email 訂閱"""
    email = data.get("email")
    await SubscribeService.add_subscribe(email, session)
    return success(message="訂閱成功！")


@router.get("")
async def get_all_subscribes(current_user: User = Depends(verify_token), session: AsyncSession = Depends(get_session)):
    """取得全部訂閱"""
    subscribes = await SubscribeService.get_all_subscribes(session)
    return success(data=subscribes)


@router.delete("/{subscribe_id}")
async def delete_subscribe(
    subscribe_id: int,
    current_user: User = Depends(verify_token),
    session: AsyncSession = Depends(get_session)
):
    """刪除訂閱"""
    await SubscribeService.delete_subscribe(subscribe_id, session)
    return success(message="訂閱已成功刪除")