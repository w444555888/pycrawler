from typing import Optional


from datetime import datetime, timezone
from app.models.room_inventory import RoomInventory
from app.models.room import Room
from app.models.hotel import Hotel

from app.utils.response import success
from app.utils.error_handler import raise_error


# 建立房型
async def create_room(data):
    hotel = await Hotel.get(data.get("hotelId"))
    if not hotel:
        raise_error(400, "找不到對應的飯店")

    room = Room(**data)
    await room.insert()
    return success(data=room)


# 更新房型（含庫存資訊）
async def update_room(room_id: str, data: dict):
    room = await Room.get(room_id)
    if not room:
        raise_error(404, "找不到該房型")
    # model_validate: 驗證並轉換前端傳入的 dict 成為 Room 模型
    #   - 自動處理 alias -> 欄位名 (例如 roomType -> room_type)
    #   - 自動做型別轉換 (例如 "5" -> int 5)
    #   - 如果資料不合法，會丟出 ValidationError
    #
    # model_dump: 把模型轉回 dict
    #   - exclude_unset=True: 只保留有提供的欄位 (適合做部分更新)
    #   - by_alias=True 時會用 alias 名稱輸出 (例如 roomType 而不是 room_type)
    update_data = Room.model_validate(data).model_dump(exclude_unset=True)
    for k, v in update_data.items():
        # setattr(room, "room_type", "Twin Room")  等於 room.room_type = "Twin Room"
        # setattr(room, "max_people", 5)           等於 room.max_people = 5
        setattr(room, k, v)

    room.update_timestamp()
    await room.save()

    # 查詢該房型所有庫存
    inventories = (
        await RoomInventory.find(RoomInventory.room_id == room_id)
        .sort("date")
        .to_list()
    )

    inventory_data = [
        {
            "date": inv.date,
            "totalRooms": inv.total_rooms or 0,
            "bookedRooms": inv.booked_rooms or 0,
            "remainingRooms": inv.remaining_rooms,
        }
        for inv in inventories
    ]

    return success(data={"room": room, "inventory": inventory_data})


# 刪除房型
async def delete_room(room_id: str):
    room = await Room.get(room_id)
    if not room:
        raise_error(404, "找不到該房型")

    await room.delete()
    await RoomInventory.find(RoomInventory.room_id == room_id).delete()
    return success(message="刪除成功")



# 取得全部房型
async def list_rooms():
    rooms = await Room.find_all().to_list()
    success(data=rooms)



# 根據 ID 取得房型
async def get_room(room_id: str):
    room = await Room.get(room_id)
    if not room:
        raise_error(404, "找不到該房型")
    return success(data=room)



# 根據飯店 ID 取得房型列表
async def list_rooms_by_hotel(hotel_id: str):
    hotel = await Hotel.get(hotel_id)
    if not hotel:
        raise_error(404, "找不到該飯店")

    rooms = await Room.find(Room.hotel_id == PydanticObjectId(hotel_id)).to_list()
    result = []
    for room in rooms:
        inventories = await RoomInventory.find(
            RoomInventory.room_id == ObjectId(str(room.id))
        ).sort("date").to_list()

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

        result.append({
            **room.model_dump(by_alias=True, exclude_none=True), 
            "inventory": inventory_data
        })

    return success(data=result)



# 批次更新房間庫存（對應 Node.js updateRoomInventory）
async def update_room_inventory(payload: dict):
    updates = payload.get("updates", [])
    if not isinstance(updates, list) or not updates:
        raise_error(400, "缺少更新內容")

    for item in updates:
        room_id = item.get("roomId")
        date_str = item.get("date")
        total_rooms = item.get("totalRooms")

        if not room_id or not date_str:
            continue

        try:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            print(f"日期格式錯誤: {date_str}")
            continue

        existing = await RoomInventory.find_one(
            RoomInventory.room_id == ObjectId(room_id),
            RoomInventory.date == date_obj
        )

        if existing:
            existing.total_rooms = total_rooms
            existing.update_timestamp()
            await existing.save()
            print(f"更新現有庫存: roomId={room_id}, date={date_obj}, totalRooms={total_rooms}")
        else:
            new_inv = RoomInventory(
                room_id=ObjectId(room_id),
                date=date_obj,
                total_rooms=total_rooms
            )
            await new_inv.insert()
            print(f"新增庫存: roomId={room_id}, date={date_obj}, totalRooms={total_rooms}")

    return success(message="房間庫存更新成功")



