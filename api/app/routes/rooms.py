from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_session
from app.services.room_service import (
    list_rooms,             
    get_room,               
    list_rooms_by_hotel,  
    create_room,           
    update_room,           
    delete_room,
    update_room_inventory          
)

router = APIRouter(tags=["rooms"])

# 取得所有房型列表
@router.get("")
async def route_list_rooms(session: AsyncSession = Depends(get_session)):
    return await list_rooms(session)

# 取得特定房型的詳細資訊
@router.get("/{room_id}")
async def route_get_room(room_id: int, session: AsyncSession = Depends(get_session)):
    return await get_room(room_id, session)

# 根據飯店 ID 獲取該飯店下所有房型
@router.get("/findHotel/{hotel_id}")
async def route_list_rooms_by_hotel(hotel_id: int, session: AsyncSession = Depends(get_session)):
    return await list_rooms_by_hotel(hotel_id, session)

# 新增一筆房型資料
@router.post("")
async def route_create_room(data: dict, session: AsyncSession = Depends(get_session)):
    return await create_room(data, session)


# 批次更新房間庫存（等同 Node.js: PUT /updateRoomInventory）
@router.put("/updateRoomInventory")
async def route_update_room_inventory(payload: dict, session: AsyncSession = Depends(get_session)):
    return await update_room_inventory(payload, session)


# 編輯特定房型資料（根據 room_id）
@router.put("/{room_id}")
async def route_update_room(room_id: int, data: dict, session: AsyncSession = Depends(get_session)):
    return await update_room(room_id, data, session)

# 刪除特定房型資料（根據 room_id(node版本沒有)
@router.delete("/{room_id}")
async def route_delete_room(room_id: int, session: AsyncSession = Depends(get_session)):
    return await delete_room(room_id, session)