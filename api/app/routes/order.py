from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_session
from app.services.auth_service import verify_token
from app.services.order_service import (
    list_orders,
    get_order,
    create_order,
    update_order,
    delete_order,
)

router = APIRouter(tags=["orders"])

#全部訂單
@router.get("")
async def route_list_orders(session: AsyncSession = Depends(get_session)):
    return await list_orders(session)

#id查找
@router.get("/{order_id}")
async def route_get_order(order_id: int, session: AsyncSession = Depends(get_session)):
    return await get_order(order_id, session)

#新訂單
@router.post("")
async def route_create_order(data: dict, current_user=Depends(verify_token), session: AsyncSession = Depends(get_session)):
    return await create_order(data, current_user, session)

#id更新訂單
@router.put("/{order_id}")
async def route_update_order(order_id: int, data: dict, session: AsyncSession = Depends(get_session)):
    return await update_order(order_id, data, session)

#id刪除訂單
@router.delete("/{order_id}")
async def route_delete_order(order_id: int, session: AsyncSession = Depends(get_session)):
    return await delete_order(order_id, session)
