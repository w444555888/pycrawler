from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from datetime import datetime, timezone
from app.models.room_inventory import RoomInventory
from app.models.room import Room
from app.models.hotel import Hotel

from app.utils.response import success
from app.utils.error_handler import raise_error


# 建立房型
async def create_room(data: dict, session: AsyncSession):
    hotel_stmt = select(Hotel).where(Hotel.id == data.get("hotelId"))
    hotel_result = await session.execute(hotel_stmt)
    hotel = hotel_result.scalar_one_or_none()
    
    if not hotel:
        raise_error(400, "找不到對應的飯店")

    room = Room(
        hotel_id=data.get("hotelId"),
        title=data.get("title", ""),
        desc=data.get("desc", []),
        room_type=data.get("roomType", ""),
        max_people=data.get("maxPeople", 1),
        service=data.get("service", {}),
        payment_options=data.get("paymentOptions", []),
        pricing=data.get("pricing", []),
        holidays=data.get("holidays", [])
    )
    session.add(room)
    await session.commit()
    await session.refresh(room)
    
    room_data = {
        "id": room.id,
        "hotelId": room.hotel_id,
        "title": room.title,
        "desc": room.desc,
        "roomType": room.room_type,
        "maxPeople": room.max_people,
        "service": room.service,
        "paymentOptions": room.payment_options,
        "pricing": room.pricing,
        "holidays": room.holidays,
        "createdAt": room.created_at,
        "updatedAt": room.updated_at
    }
    return success(data=room_data)


# 更新房型（含庫存資訊）
async def update_room(room_id: int, data: dict, session: AsyncSession):
    room_stmt = select(Room).where(Room.id == room_id)
    room_result = await session.execute(room_stmt)
    room = room_result.scalar_one_or_none()
    
    if not room:
        raise_error(404, "找不到該房型")
    
    # 更新房间信息
    if "title" in data:
        room.title = data["title"]
    if "desc" in data:
        room.desc = data["desc"]
    if "roomType" in data:
        room.room_type = data["roomType"]
    if "maxPeople" in data:
        room.max_people = data["maxPeople"]
    if "service" in data:
        room.service = data["service"]
    if "paymentOptions" in data:
        room.payment_options = data["paymentOptions"]
    if "pricing" in data:
        room.pricing = data["pricing"]
    if "holidays" in data:
        room.holidays = data["holidays"]
    
    room.update_timestamp()
    await session.commit()
    await session.refresh(room)

    # 查詢該房型所有庫存
    inventory_stmt = select(RoomInventory).where(RoomInventory.room_id == room_id).order_by(RoomInventory.date)
    inventory_result = await session.execute(inventory_stmt)
    inventories = inventory_result.scalars().all()

    inventory_data = [
        {
            "date": inv.date,
            "totalRooms": inv.total_rooms or 0,
            "bookedRooms": inv.booked_rooms or 0,
            "remainingRooms": inv.remaining_rooms,
        }
        for inv in inventories
    ]
    
    room_data = {
        "id": room.id,
        "hotelId": room.hotel_id,
        "title": room.title,
        "desc": room.desc,
        "roomType": room.room_type,
        "maxPeople": room.max_people,
        "service": room.service,
        "paymentOptions": room.payment_options,
        "pricing": room.pricing,
        "holidays": room.holidays,
        "createdAt": room.created_at,
        "updatedAt": room.updated_at
    }

    return success(data={"room": room_data, "inventory": inventory_data})


# 刪除房型
async def delete_room(room_id: int, session: AsyncSession):
    room_stmt = select(Room).where(Room.id == room_id)
    room_result = await session.execute(room_stmt)
    room = room_result.scalar_one_or_none()
    
    if not room:
        raise_error(404, "找不到該房型")

    # 先刪除相關庫存
    inventory_delete_stmt = delete(RoomInventory).where(RoomInventory.room_id == room_id)
    await session.execute(inventory_delete_stmt)
    
    # 再刪除房间
    await session.delete(room)
    await session.commit()
    
    return success(message="刪除成功")



# 取得全部房型
async def list_rooms(session: AsyncSession):
    stmt = select(Room)
    result = await session.execute(stmt)
    rooms = result.scalars().all()
    
    room_list = []
    for room in rooms:
        room_data = {
            "id": room.id,
            "hotelId": room.hotel_id,
            "title": room.title,
            "desc": room.desc,
            "roomType": room.room_type,
            "maxPeople": room.max_people,
            "service": room.service,
            "paymentOptions": room.payment_options,
            "pricing": room.pricing,
            "holidays": room.holidays,
            "createdAt": room.created_at,
            "updatedAt": room.updated_at
        }
        room_list.append(room_data)
    return success(data=room_list)



# 根據 ID 取得房型
async def get_room(room_id: int, session: AsyncSession):
    stmt = select(Room).where(Room.id == room_id)
    result = await session.execute(stmt)
    room = result.scalar_one_or_none()
    
    if not room:
        raise_error(404, "找不到該房型")
    
    room_data = {
        "id": room.id,
        "hotelId": room.hotel_id,
        "title": room.title,
        "desc": room.desc,
        "roomType": room.room_type,
        "maxPeople": room.max_people,
        "service": room.service,
        "paymentOptions": room.payment_options,
        "pricing": room.pricing,
        "holidays": room.holidays,
        "createdAt": room.created_at,
        "updatedAt": room.updated_at
    }
    return success(data=room_data)



# 根據飯店 ID 取得房型列表
async def list_rooms_by_hotel(hotel_id: int, session: AsyncSession):
    hotel_stmt = select(Hotel).where(Hotel.id == hotel_id)
    hotel_result = await session.execute(hotel_stmt)
    hotel = hotel_result.scalar_one_or_none()
    
    if not hotel:
        raise_error(404, "找不到該飯店")

    room_stmt = select(Room).where(Room.hotel_id == hotel_id)
    room_result = await session.execute(room_stmt)
    rooms = room_result.scalars().all()
    
    result = []
    for room in rooms:
        inventory_stmt = select(RoomInventory).where(RoomInventory.room_id == room.id).order_by(RoomInventory.date)
        inventory_result = await session.execute(inventory_stmt)
        inventories = inventory_result.scalars().all()

        inventory_data = [
            {
                "date": inv.date,
                "totalRooms": inv.total_rooms or 0,
                "bookedRooms": inv.booked_rooms or 0,
                "remainingRooms": inv.remaining_rooms,
                "missing": False,
            }
            for inv in inventories
        ]

        room_data = {
            "id": room.id,
            "hotelId": room.hotel_id,
            "title": room.title,
            "desc": room.desc,
            "roomType": room.room_type,
            "maxPeople": room.max_people,
            "service": room.service,
            "paymentOptions": room.payment_options,
            "pricing": room.pricing,
            "holidays": room.holidays,
            "createdAt": room.created_at,
            "updatedAt": room.updated_at,
            "inventory": inventory_data
        }
        result.append(room_data)

    return success(data=result)



# 批次更新房間庫存（對應 Node.js updateRoomInventory）
async def update_room_inventory(payload: dict, session: AsyncSession):
    updates = payload.get("updates", [])
    if not isinstance(updates, list) or not updates:
        raise_error(400, "缺少更新內容")

    for item in updates:
        room_id = item.get("roomId")
        date_str = item.get("date")
        total_rooms = item.get("totalRooms")
        
        if not all([room_id, date_str, total_rooms is not None]):
            continue
            
        try:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            print(f"日期格式錯誤: {date_str}")
            continue
            
        # 查找現有庫存記錄
        existing_stmt = select(RoomInventory).where(
            RoomInventory.room_id == room_id,
            RoomInventory.date == date_obj
        )
        existing_result = await session.execute(existing_stmt)
        existing = existing_result.scalar_one_or_none()
        
        if existing:
            # 更新現有記錄
            existing.total_rooms = total_rooms
            existing.update_timestamp()
            print(f"更新現有庫存: roomId={room_id}, date={date_obj}, totalRooms={total_rooms}")
        else:
            # 建立新記錄
            new_inv = RoomInventory(
                room_id=room_id,
                date=date_obj,
                total_rooms=total_rooms,
                booked_rooms=0
            )
            session.add(new_inv)
            print(f"新增庫存: roomId={room_id}, date={date_obj}, totalRooms={total_rooms}")
            
    await session.commit()
    return success(message="房間庫存更新成功")



