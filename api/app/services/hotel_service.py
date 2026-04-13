from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime, date, timedelta
from ..models.hotel import Hotel
from ..models.room import Room
from ..models.room_inventory import RoomInventory
from ..utils.response import success
from ..utils.error_handler import raise_error


# 获取所有酒店数据
async def get_all_hotels(session: AsyncSession):
    """获取所有酒店"""
    stmt = select(Hotel)
    result = await session.execute(stmt)
    hotels = result.scalars().all()
    
    # 转换为字典格式
    hotels_data = []
    for hotel in hotels:
        hotel_data = {
            "id": hotel.id,
            "name": hotel.name,
            "type": hotel.type,
            "city": hotel.city,
            "address": hotel.address,
            "distance": hotel.distance,
            "photos": hotel.photos,
            "title": hotel.title,
            "desc": hotel.desc,
            "rating": hotel.rating,
            "cheapest_price": hotel.cheapest_price,
            "popular_hotel": hotel.popular_hotel,
            "comments": hotel.comments,
            "facilities": hotel.facilities,
            "check_in_time": hotel.check_in_time,
            "check_out_time": hotel.check_out_time,
            "coordinates": hotel.coordinates,
            "email": hotel.email,
            "nearby_attractions": hotel.nearby_attractions,
            "phone": hotel.phone,
            "created_at": hotel.created_at,
            "updated_at": hotel.updated_at
        }
        hotels_data.append(hotel_data)
    
    return success(data=hotels_data)


# 根据ID获取酒店
async def get_hotel_by_id(session: AsyncSession, hotel_id: int):
    """根据ID获取酒店"""
    stmt = select(Hotel).where(Hotel.id == hotel_id)
    result = await session.execute(stmt)
    hotel = result.scalar_one_or_none()
    
    if not hotel:
        raise_error(404, "找不到該酒店")
    
    hotel_data = {
        "id": hotel.id,
        "name": hotel.name,
        "type": hotel.type,
        "city": hotel.city,
        "address": hotel.address,
        "distance": hotel.distance,
        "photos": hotel.photos,
        "title": hotel.title,
        "desc": hotel.desc,
        "rating": hotel.rating,
        "cheapest_price": hotel.cheapest_price,
        "popular_hotel": hotel.popular_hotel,
        "comments": hotel.comments,
        "facilities": hotel.facilities,
        "check_in_time": hotel.check_in_time,
        "check_out_time": hotel.check_out_time,
        "coordinates": hotel.coordinates,
        "email": hotel.email,
        "nearby_attractions": hotel.nearby_attractions,
        "phone": hotel.phone,
        "created_at": hotel.created_at,
        "updated_at": hotel.updated_at
    }
    return success(data=hotel_data)


# 创建酒店
async def create_hotel(session: AsyncSession, hotel_data: dict):
    """创建新酒店"""
    hotel = Hotel(**hotel_data)
    session.add(hotel)
    await session.commit()
    await session.refresh(hotel)
    
    # 转换为字典格式
    new_hotel_data = {
        "id": hotel.id,
        "name": hotel.name,
        "type": hotel.type,
        "city": hotel.city,
        "address": hotel.address,
        "distance": hotel.distance,
        "photos": hotel.photos,
        "title": hotel.title,
        "desc": hotel.desc,
        "rating": hotel.rating,
        "cheapest_price": hotel.cheapest_price,
        "popular_hotel": hotel.popular_hotel,
        "comments": hotel.comments,
        "facilities": hotel.facilities,
        "check_in_time": hotel.check_in_time,
        "check_out_time": hotel.check_out_time,
        "coordinates": hotel.coordinates,
        "email": hotel.email,
        "nearby_attractions": hotel.nearby_attractions,
        "phone": hotel.phone,
        "created_at": hotel.created_at,
        "updated_at": hotel.updated_at
    }
    return success(data=new_hotel_data)


# 模糊搜索酒店名称
async def get_hotel_name_suggestions(session: AsyncSession, name: Optional[str] = None):
    """模糊搜索酒店名称"""
    if not name or not name.strip():
        return success(data=[])
        
    stmt = select(Hotel).where(
        Hotel.name.ilike(f"%{name}%")
    ).limit(10)
    
    result = await session.execute(stmt)
    hotels = result.scalars().all()
    
    hotel_suggestions = [{"id": h.id, "name": h.name} for h in hotels]
    return success(data=hotel_suggestions)


# 按城市获取酒店
async def get_hotels_by_city(session: AsyncSession, city: str):
    """按城市获取酒店"""
    stmt = select(Hotel).where(Hotel.city.ilike(f"%{city}%"))
    result = await session.execute(stmt)
    hotels = result.scalars().all()
    
    # 转换为字典格式
    hotels_data = []
    for hotel in hotels:
        hotel_data = {
            "id": hotel.id,
            "name": hotel.name,
            "type": hotel.type,
            "city": hotel.city,
            "address": hotel.address,
            "distance": hotel.distance,
            "photos": hotel.photos,
            "title": hotel.title,
            "desc": hotel.desc,
            "rating": hotel.rating,
            "cheapest_price": hotel.cheapest_price,
            "popular_hotel": hotel.popular_hotel,
            "comments": hotel.comments,
            "facilities": hotel.facilities,
            "check_in_time": hotel.check_in_time,
            "check_out_time": hotel.check_out_time,
            "coordinates": hotel.coordinates,
            "email": hotel.email,
            "nearby_attractions": hotel.nearby_attractions,
            "phone": hotel.phone,
            "created_at": hotel.created_at,
            "updated_at": hotel.updated_at
        }
        hotels_data.append(hotel_data)
    return success(data=hotels_data)


# 按类型获取酒店  
async def get_hotels_by_type(session: AsyncSession, hotel_type: str):
    """按类型获取酒店"""
    stmt = select(Hotel).where(Hotel.type == hotel_type)
    result = await session.execute(stmt)
    hotels = result.scalars().all()
    
    # 转换为字典格式
    hotels_data = []
    for hotel in hotels:
        hotel_data = {
            "id": hotel.id,
            "name": hotel.name,
            "type": hotel.type,
            "city": hotel.city,
            "address": hotel.address,
            "distance": hotel.distance,
            "photos": hotel.photos,
            "title": hotel.title,
            "desc": hotel.desc,
            "rating": hotel.rating,
            "cheapest_price": hotel.cheapest_price,
            "popular_hotel": hotel.popular_hotel,
            "comments": hotel.comments,
            "facilities": hotel.facilities,
            "check_in_time": hotel.check_in_time,
            "check_out_time": hotel.check_out_time,
            "coordinates": hotel.coordinates,
            "email": hotel.email,
            "nearby_attractions": hotel.nearby_attractions,
            "phone": hotel.phone,
            "created_at": hotel.created_at,
            "updated_at": hotel.updated_at
        }
        hotels_data.append(hotel_data)
    return success(data=hotels_data)



# 查詢熱門飯店
async def get_popular_hotels(session: AsyncSession):
    stmt = select(Hotel).where(Hotel.popular_hotel == True)
    result = await session.execute(stmt)
    hotels = result.scalars().all()
    
    # 转换为字典格式
    hotels_data = []
    for hotel in hotels:
        hotel_data = {
            "id": hotel.id,
            "name": hotel.name,
            "type": hotel.type,
            "city": hotel.city,
            "address": hotel.address,
            "distance": hotel.distance,
            "photos": hotel.photos,
            "title": hotel.title,
            "desc": hotel.desc,
            "rating": hotel.rating,
            "cheapest_price": hotel.cheapest_price,
            "popular_hotel": hotel.popular_hotel,
            "comments": hotel.comments,
            "facilities": hotel.facilities,
            "check_in_time": hotel.check_in_time,
            "check_out_time": hotel.check_out_time,
            "coordinates": hotel.coordinates,
            "email": hotel.email,
            "nearby_attractions": hotel.nearby_attractions,
            "phone": hotel.phone,
            "created_at": hotel.created_at,
            "updated_at": hotel.updated_at
        }
        hotels_data.append(hotel_data)
    return success(data=hotels_data)   



# 資料層清理器(遞迴清理) — 取代 jsonable_encoder，防止 DBRef 錯誤
def clean_for_json(obj):
    """安全遞迴轉換所有資料，避免 ObjectId / BaseModel 造成 JSON 錯誤"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, date):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [clean_for_json(v) for v in obj]
    return obj




# 搜尋飯店資料 (依篩選條件) - 簡化版SQLAlchemy實現
async def list_hotels(
    session: AsyncSession,
    name: Optional[str] = None,
    hotel_id: Optional[int] = None,
    popular: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    adult: Optional[int] = None,
    room: Optional[int] = None
):
    try:
        # 建立基本查詢
        stmt = select(Hotel)
        
        # 添加條件
        if name:
            stmt = stmt.where(Hotel.name.ilike(f"%{name}%"))
        if hotel_id:
            stmt = stmt.where(Hotel.id == hotel_id)
        if popular:
            stmt = stmt.where(Hotel.popular_hotel == True)
        if min_price is not None:
            stmt = stmt.where(Hotel.cheapest_price >= min_price)
        if max_price is not None:
            stmt = stmt.where(Hotel.cheapest_price <= max_price)
        
        result = await session.execute(stmt)
        hotels = result.scalars().all()
        
        # 如果查詢條件中有 hotel_id 但找不到，直接返回空結果（不是錯誤）
        if hotel_id and not hotels:
            return success(data=[])
        
        # 如果是一般搜尋但找不到結果，也返回空結果
        if not hotels:
            return success(data=[])
        
        # 轉換資料格式
        hotel_list = []
        for hotel in hotels:
            # 查詢相關房間
            room_stmt = select(Room).where(Room.hotel_id == hotel.id)
            room_result = await session.execute(room_stmt)
            rooms = room_result.scalars().all()
            
            available_rooms = []
            for room in rooms:
                # 根據成人數篩選房間
                if adult and room.max_people < adult:
                    continue
                
                # 查詢房間庫存
                inventory_stmt = select(RoomInventory).where(RoomInventory.room_id == room.id)
                
                # 如果有日期範圍，篩選該範圍內的庫存
                if start_date and end_date:
                    try:
                        from datetime import datetime
                        start = datetime.strptime(start_date, "%Y-%m-%d").date()
                        end = datetime.strptime(end_date, "%Y-%m-%d").date()
                        inventory_stmt = inventory_stmt.where(
                            RoomInventory.date >= start,
                            RoomInventory.date <= end
                        )
                        # 只篩選有剩餘房間的庫存
                        inventory_stmt = inventory_stmt.filter(
                            RoomInventory.total_rooms > RoomInventory.booked_rooms
                        )
                    except ValueError:
                        pass  # 如果日期格式錯誤，不做日期篩選
                
                inventory_result = await session.execute(inventory_stmt)
                inventories = inventory_result.scalars().all()
                
                # 如果指定了日期範圍但沒有可用庫存，跳過這個房間
                if start_date and end_date and not inventories:
                    continue
                
                # 轉換庫存資料
                room_inventories = []
                for inventory in inventories:
                    inventory_data = {
                        "id": inventory.id,
                        "roomId": inventory.room_id,
                        "date": inventory.date,
                        "availableRooms": inventory.remaining_rooms,  # 使用計算屬性
                        "totalRooms": inventory.total_rooms,
                        "bookedRooms": inventory.booked_rooms,
                        "isAvailable": inventory.remaining_rooms > 0,  # 計算可用性
                        "createdAt": inventory.created_at,
                        "updatedAt": inventory.updated_at
                    }
                    room_inventories.append(inventory_data)
                
                # 計算房間總價格（如果有日期範圍）
                room_total_price = 0.0
                if start_date and end_date:
                    try:
                        room_total_price = room.calculate_total_price(start_date, end_date)
                    except Exception as e:
                        print(f"計算房間總價格時出錯: {e}")
                        room_total_price = 0.0
                
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
                    "inventory": room_inventories,
                    "roomTotalPrice": room_total_price,  # 添加總價格字段
                    "createdAt": room.created_at,
                    "updatedAt": room.updated_at
                }
                available_rooms.append(room_data)
            
            hotel_data = {
                "id": hotel.id,
                "name": hotel.name,
                "type": hotel.type,
                "city": hotel.city,
                "address": hotel.address,
                "distance": hotel.distance,
                "photos": hotel.photos,
                "title": hotel.title,
                "desc": hotel.desc,
                "rating": hotel.rating,
                "cheapestPrice": hotel.cheapest_price,
                "popularHotel": hotel.popular_hotel,
                "comments": hotel.comments,
                "facilities": hotel.facilities,
                "checkInTime": hotel.check_in_time,
                "checkOutTime": hotel.check_out_time,
                "coordinates": hotel.coordinates,
                "email": hotel.email,
                "nearbyAttractions": hotel.nearby_attractions,
                "phone": hotel.phone,
                "availableRooms": available_rooms,
                "createdAt": hotel.created_at,
                "updatedAt": hotel.updated_at
            }
            hotel_list.append(hotel_data)
        
        return success(data=clean_for_json(hotel_list))
        
    except ValueError as e:
        # 處理日期格式錯誤等值錯誤
        print(f"list_hotels ValueError: {e}")
        return success(data=[], message="日期格式錯誤或參數無效")
    except Exception as e:
        import traceback
        print(f"list_hotels 例外型別: {type(e)}")
        print(f"list_hotels 例外內容: {e}")
        print(traceback.format_exc())
        # 重新抛出异常
        raise e





# 取得單一飯店
async def get_hotel(hotel_id: int, session: AsyncSession):
    stmt = select(Hotel).where(Hotel.id == hotel_id)
    result = await session.execute(stmt)
    hotel = result.scalar_one_or_none()
    
    if not hotel:
        raise_error(404, "找不到該飯店")
    
    hotel_data = {
        "id": hotel.id,
        "name": hotel.name,
        "type": hotel.type,
        "city": hotel.city,
        "address": hotel.address,
        "distance": hotel.distance,
        "photos": hotel.photos,
        "title": hotel.title, 
        "desc": hotel.desc,
        "rating": hotel.rating,
        "cheapestPrice": hotel.cheapest_price,
        "popularHotel": hotel.popular_hotel,
        "comments": hotel.comments,
        "facilities": hotel.facilities,
        "checkInTime": hotel.check_in_time,
        "checkOutTime": hotel.check_out_time,
        "coordinates": hotel.coordinates,
        "email": hotel.email,
        "nearbyAttractions": hotel.nearby_attractions,
        "phone": hotel.phone,
        "createdAt": hotel.created_at,
        "updatedAt": hotel.updated_at
    }
    return success(data=hotel_data)


# 新增飯店
async def create_hotel_service(data: dict, session: AsyncSession):
    hotel = Hotel(
        name=data.get("name", ""),
        type=data.get("type", "hotel"),
        city=data.get("city", ""),
        address=data.get("address", ""),
        distance=data.get("distance"),
        photos=data.get("photos", []),
        title=data.get("title", ""),
        desc=data.get("desc", ""),
        rating=data.get("rating"),
        cheapest_price=data.get("cheapestPrice", 0),
        popular_hotel=data.get("popularHotel", False),
        comments=data.get("comments", 0),
        facilities=data.get("facilities", {}),
        check_in_time=data.get("checkInTime", "14:00"),
        check_out_time=data.get("checkOutTime", "12:00"),
        coordinates=data.get("coordinates", {}),
        email=data.get("email", ""),
        nearby_attractions=data.get("nearbyAttractions", []),
        phone=data.get("phone", "")
    )
    session.add(hotel)
    await session.commit()
    await session.refresh(hotel)
    
    hotel_data = {
        "id": hotel.id,
        "name": hotel.name,
        "type": hotel.type,
        "city": hotel.city,
        "address": hotel.address,
        "distance": hotel.distance,
        "photos": hotel.photos,
        "title": hotel.title,
        "desc": hotel.desc,
        "rating": hotel.rating,
        "cheapestPrice": hotel.cheapest_price,
        "popularHotel": hotel.popular_hotel,
        "comments": hotel.comments,
        "facilities": hotel.facilities,
        "checkInTime": hotel.check_in_time,
        "checkOutTime": hotel.check_out_time,
        "coordinates": hotel.coordinates,
        "email": hotel.email,
        "nearbyAttractions": hotel.nearby_attractions,
        "phone": hotel.phone,
        "createdAt": hotel.created_at,
        "updatedAt": hotel.updated_at
    }
    return success(data=hotel_data)

# 更新飯店
async def update_hotel(hotel_id: int, data: dict, session: AsyncSession):
    stmt = select(Hotel).where(Hotel.id == hotel_id)
    result = await session.execute(stmt)
    hotel = result.scalar_one_or_none()
    
    if not hotel:
        raise_error(404, "找不到該飯店")

    # 更新欄位
    if "name" in data:
        hotel.name = data["name"]
    if "type" in data:
        hotel.type = data["type"]
    if "city" in data:
        hotel.city = data["city"]
    if "address" in data:
        hotel.address = data["address"]
    if "distance" in data:
        hotel.distance = data["distance"]
    if "photos" in data:
        hotel.photos = data["photos"]
    if "title" in data:
        hotel.title = data["title"]
    if "desc" in data:
        hotel.desc = data["desc"]
    if "rating" in data:
        hotel.rating = data["rating"]
    if "cheapestPrice" in data:
        hotel.cheapest_price = data["cheapestPrice"]
    if "popularHotel" in data:
        hotel.popular_hotel = data["popularHotel"]
    if "comments" in data:
        hotel.comments = data["comments"]
    if "facilities" in data:
        hotel.facilities = data["facilities"]
    if "checkInTime" in data:
        hotel.check_in_time = data["checkInTime"]
    if "checkOutTime" in data:
        hotel.check_out_time = data["checkOutTime"]
    if "coordinates" in data:
        hotel.coordinates = data["coordinates"]
    if "email" in data:
        hotel.email = data["email"]
    if "nearbyAttractions" in data:
        hotel.nearby_attractions = data["nearbyAttractions"]
    if "phone" in data:
        hotel.phone = data["phone"]
    
    hotel.update_timestamp()
    await session.commit()
    await session.refresh(hotel)
    
    hotel_data = {
        "id": hotel.id,
        "name": hotel.name,
        "type": hotel.type,
        "city": hotel.city,
        "address": hotel.address,
        "distance": hotel.distance,
        "photos": hotel.photos,
        "title": hotel.title,
        "desc": hotel.desc,
        "rating": hotel.rating,
        "cheapestPrice": hotel.cheapest_price,
        "popularHotel": hotel.popular_hotel,
        "comments": hotel.comments,
        "facilities": hotel.facilities,
        "checkInTime": hotel.check_in_time,
        "checkOutTime": hotel.check_out_time,
        "coordinates": hotel.coordinates,
        "email": hotel.email,
        "nearbyAttractions": hotel.nearby_attractions,
        "phone": hotel.phone,
        "createdAt": hotel.created_at,
        "updatedAt": hotel.updated_at
    }
    return success(data=hotel_data)


# 刪除飯店
async def delete_hotel(hotel_id: int, session: AsyncSession):
    stmt = select(Hotel).where(Hotel.id == hotel_id)
    result = await session.execute(stmt)
    hotel = result.scalar_one_or_none()
    
    if not hotel:
        raise_error(404, "找不到該飯店")
    
    await session.delete(hotel)
    await session.commit()
    return success(message="刪除成功")
