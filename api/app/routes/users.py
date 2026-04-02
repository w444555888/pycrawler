from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.user_service import (
    get_all_users,
    get_user,
    update_user,
    delete_user
)
from app.services.auth_service import verify_token
from app.db import get_session

router = APIRouter(tags=["users"])

# 全部用户资料
@router.get("")
async def route_get_all_users(
    current_user: dict = Depends(verify_token),
    session: AsyncSession = Depends(get_session)
):
    return await get_all_users(current_user, session)

# 单一用户资料
@router.get("/{user_id}")
async def route_get_user(
    user_id: int, 
    current_user: dict = Depends(verify_token),
    session: AsyncSession = Depends(get_session)
):
    return await get_user(user_id, current_user, session)

# 更新用户资料
@router.put("/{user_id}")
async def route_update_user(
    user_id: int, 
    data: dict, 
    current_user: dict = Depends(verify_token),
    session: AsyncSession = Depends(get_session)
):
    return await update_user(user_id, data, current_user, session)

# 删除用户资料
@router.delete("/{user_id}")
async def route_delete_user(
    user_id: int, 
    current_user: dict = Depends(verify_token),
    session: AsyncSession = Depends(get_session)
):
    return await delete_user(user_id, current_user, session)
