from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, func
from typing import List, Optional
from ..models.hotel import Hotel
from ..models.room import Room


# 获取所有酒店数据
async def get_all_hotels(session: AsyncSession):
    """获取所有酒店"""
    stmt = select(Hotel)
    result = await session.execute(stmt)
    return result.scalars().all()


# 根据ID获取酒店
async def get_hotel_by_id(session: AsyncSession, hotel_id: int):
    """根据ID获取酒店"""
    stmt = select(Hotel).where(Hotel.id == hotel_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


# 创建酒店
async def create_hotel(session: AsyncSession, hotel_data: dict):
    """创建新酒店"""
    hotel = Hotel(**hotel_data)
    session.add(hotel)
    await session.commit()
    await session.refresh(hotel)
    return hotel


# 模糊搜索酒店名称
async def get_hotel_name_suggestions(session: AsyncSession, name: Optional[str] = None):
    """模糊搜索酒店名称"""
    if not name or not name.strip():
        return []
        
    stmt = select(Hotel).where(
        Hotel.name.ilike(f"%{name}%")
    ).limit(10)
    
    result = await session.execute(stmt)
    hotels = result.scalars().all()
    
    return [{"id": h.id, "name": h.name} for h in hotels]


# 按城市获取酒店
async def get_hotels_by_city(session: AsyncSession, city: str):
    """按城市获取酒店"""
    stmt = select(Hotel).where(Hotel.city.ilike(f"%{city}%"))
    result = await session.execute(stmt)
    return result.scalars().all()


# 按类型获取酒店  
async def get_hotels_by_type(session: AsyncSession, hotel_type: str):
    """按类型获取酒店"""
    stmt = select(Hotel).where(Hotel.type == hotel_type)
    result = await session.execute(stmt)
    return result.scalars().all()



# 查詢熱門飯店
async def get_popular_hotels():
    hotels = await Hotel.find({"popularHotel": True}).to_list()
    return success(data=hotels)   



# 資料層清理器(遞迴清理) — 取代 jsonable_encoder，防止 DBRef 錯誤
def clean_for_json(obj):
    """安全遞迴轉換所有資料，避免 DBRef / ObjectId / BaseModel 造成 JSON 錯誤"""
    if isinstance(obj, DBRef):
        # Node.js virtual populate 結構
        return str(obj.id)
    if isinstance(obj, (ObjectId, PydanticObjectId)):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, BaseModel):
        return clean_for_json(obj.model_dump(by_alias=True, exclude_none=True))
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [clean_for_json(v) for v in obj]
    return obj




# 搜尋飯店資料 (依篩選條件)
async def list_hotels(
    name: Optional[str] = None,
    hotel_id: Optional[str] = None,
    popular: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    query = {}
    safe_data = []

    # 條件設定
    if name:
        query["name"] = {"$regex": name, "$options": "i"}
    if hotel_id:
        query["_id"] = ObjectId(hotel_id)
    if popular:
        query["popularHotel"] = True
    try:
        # 單查 hotel，不用房型與價格
        is_single_query = (
            hotel_id and not name and not min_price and not max_price and not start_date and not end_date
        )
        if is_single_query:
            hotel = await Hotel.get(ObjectId(hotel_id))
            if not hotel:
                raise_error(404, "找不到此飯店")
            hotel_data = hotel.model_dump(by_alias=True, exclude_none=True, exclude={"rooms"})
            hotel_data["availableRooms"] = []
            return success(data=[hotel_data])
        
        # 多查 hotel，需帶房型與價格
        hotels = await Hotel.find(query).to_list()
        if not hotels:
            raise_error(404, "找不到符合條件的飯店")

        updated_hotels = []
        for hotel in hotels:
            current_hotel_id = ObjectId(str(hotel.id))

            # 若 query 中有 hotel_id，這裡自然只查該飯店的房型
            rooms = await Room.find(Room.hotel_id == current_hotel_id).to_list()

            if not rooms:
                print(f"此飯店無房型: {hotel.name}")
                continue

            cheapest_price = None
            available_rooms = []

            for idx, room in enumerate(rooms):
                print(f"房型[{idx}]：{room.title}")
                print(f"start_date={start_date}, end_date={end_date}")

                price = room.calculate_total_price(start_date, end_date)
                print(f"計算結果：{price}")

                if not price or price <= 0:
                    continue

                # 計算房間庫存篩選
                inventory_query = {"roomId": ObjectId(room.id)}
                if start_date and end_date:
                    try:
                        start = datetime.strptime(start_date, "%Y-%m-%d").date()
                        end = datetime.strptime(end_date, "%Y-%m-%d").date() - timedelta(days=1)
                        # $gte = 大於等於，$lte = 小於等於
                        inventory_query["date"] = {"$gte": start, "$lte": end}
                    except Exception as e:
                        print(f"計算房間庫存篩選日期解析錯誤: {e}")

                inventories = await RoomInventory.find(inventory_query).sort("date").to_list()
                inventory_data = [
                    {
                        "date": str(inv.date),
                        "totalRooms": inv.total_rooms or 0,
                        "bookedRooms": inv.booked_rooms or 0,
                        "remainingRooms": inv.remaining_rooms,
                    }
                    for inv in inventories
                ]

                if cheapest_price is None or price < cheapest_price:
                    cheapest_price = price

                room_data = room.model_dump(by_alias=True, exclude_none=True)
                room_data["hotelId"] = str(
                    getattr(room, "hotelId", getattr(room, "hotel_id", current_hotel_id))
                )
                room_data["roomTotalPrice"] = price
                room_data["inventory"] = inventory_data
                available_rooms.append(room_data)

            # --- 更新最低價 ---
            if cheapest_price is not None and (hotel.cheapest_price != cheapest_price):
                try:
                    hotel.cheapest_price = cheapest_price
                    await hotel.save()
                except Exception as e:
                    print(f"更新最低價失敗: {e}")

            hotel_data = hotel.model_dump(by_alias=True, exclude_none=True, exclude={"rooms"})
            hotel_data["availableRooms"] = available_rooms
            hotel_data["cheapestPrice"] = cheapest_price or hotel.cheapest_price or 0
            updated_hotels.append(hotel_data)

        if min_price is not None or max_price is not None:
            updated_hotels = [
                h for h in updated_hotels
                if h.get("cheapestPrice") is not None
                and (min_price is None or h["cheapestPrice"] >= min_price)
                and (max_price is None or h["cheapestPrice"] <= max_price)
            ]

        safe_data = clean_for_json(updated_hotels)

    except Exception as e:
        import traceback
        print(f"list_hotels 例外型別: {type(e)}")
        print(f"list_hotels 例外內容: {e}")
        print(traceback.format_exc())
        safe_data = []

    return success(data=safe_data, exclude_fields=["rooms"])





# 取得單一飯店
async def get_hotel(hotel_id: str):
    hotel = await Hotel.get(hotel_id)
    if not hotel:
        raise_error(404, "找不到該飯店")
    return success(data=hotel)


# 新增飯店
async def create_hotel(data):
    hotel = Hotel(**data)
    await hotel.insert()
    return success(data=hotel)

# 更新飯店
async def update_hotel(hotel_id: str, data: dict):
    hotel = await Hotel.get(hotel_id)
    if not hotel:
        raise_error(404, "找不到該飯店")

    update_data = Hotel.model_validate(data).model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(hotel, k, v)

    await hotel.save()
    return success(data=hotel)


# 刪除飯店
async def delete_hotel(hotel_id: str):
    hotel = await Hotel.get(hotel_id)
    if not hotel:
        raise_error(404, "找不到該飯店")
    await hotel.delete()
    return success(message="刪除成功")
