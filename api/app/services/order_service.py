from fastapi import HTTPException
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.room_inventory import RoomInventory
from app.models.room import Room
from app.models.hotel import Hotel
from app.models.order import Order
from app.models.user import User
from app.utils.response import success
from app.utils.error_handler import raise_error
from typing import Dict, Optional, List
# 服務費率
SERVICE_FEE_RATE = 0.10


# 取得全部訂單
async def list_orders(session: AsyncSession):
    stmt = select(Order)
    order_result = await session.execute(stmt)
    orders = order_result.scalars().all()
    
    result = []
    for order in orders:
        # 查找相關飯店和房间信息
        hotel = None
        room = None
        
        if order.hotel_id:
            hotel_stmt = select(Hotel).where(Hotel.id == order.hotel_id)
            hotel_result = await session.execute(hotel_stmt)
            hotel = hotel_result.scalar_one_or_none()
            
        if order.room_id:
            room_stmt = select(Room).where(Room.id == order.room_id)
            room_result = await session.execute(room_stmt)
            room = room_result.scalar_one_or_none()
        
        order_data = {
            "id": order.id,
            "userId": order.user_id,
            "hotelId": order.hotel_id,
            "roomId": order.room_id,
            "hotelName": hotel.name if hotel else "",
            "roomTitle": room.title if room else "",
            "checkInDate": order.check_in_date,
            "checkOutDate": order.check_out_date,
            "totalPrice": order.total_price,
            "status": order.status,
            "payment": order.payment,
            "createdAt": order.created_at,
            "updatedAt": order.updated_at
        }
        result.append(order_data)
    
    return success(data=result)


# 根據 ID 取得單一訂單（含 hotel、room）
async def get_order(order_id: int, session: AsyncSession):
    stmt = select(Order).where(Order.id == order_id)
    order_result = await session.execute(stmt)
    order = order_result.scalar_one_or_none()
    
    if not order:
        raise_error(404, "訂單找不到")
    
    # 查找相關的酒店和房間信息
    hotel = None
    room = None
    
    if order.hotel_id:
        hotel_stmt = select(Hotel).where(Hotel.id == order.hotel_id)
        hotel_result = await session.execute(hotel_stmt)
        hotel = hotel_result.scalar_one_or_none()
        
    if order.room_id:
        room_stmt = select(Room).where(Room.id == order.room_id)
        room_result = await session.execute(room_stmt)
        room = room_result.scalar_one_or_none()
    
    order_data = {
        "id": order.id,
        "userId": order.user_id,
        "hotelId": order.hotel_id,
        "roomId": order.room_id,
        "hotelName": hotel.name if hotel else "",
        "roomTitle": room.title if room else "",
        "checkInDate": order.check_in_date,
        "checkOutDate": order.check_out_date,
        "totalPrice": order.total_price,
        "status": order.status,
        "payment": order.payment,
        "createdAt": order.created_at,
        "updatedAt": order.updated_at
    }
    
    return success(data=order_data)



# 新訂單（含庫存檢查與手續費計算）
async def create_order(data: Dict, current_user: dict, session: AsyncSession):
    hotel_id = data.get("hotelId")
    room_id = data.get("roomId")
    total_price = data.get("totalPrice")
    check_in = data.get("checkInDate")
    check_out = data.get("checkOutDate")

    if not hotel_id or not room_id or not total_price or not check_in or not check_out:
        raise_error(400, "缺少必要欄位")

    try:
        hotel_id = int(hotel_id)
        room_id = int(room_id)
        total_price = float(total_price)
    except (ValueError, TypeError):
        raise_error(400, "ID或價格格式錯誤")

    # 轉日期型別 - 轉換為無時區的datetime對象
    try:
        start = datetime.strptime(check_in, "%Y-%m-%d")  
        end = datetime.strptime(check_out, "%Y-%m-%d")   
    except Exception:
        raise_error(400, "日期格式錯誤，請使用 YYYY-MM-DD")

    if end <= start:
        raise_error(400, "退房日必須晚於入住日")

    # 驗證飯店與房型存在
    hotel_stmt = select(Hotel).where(Hotel.id == hotel_id)
    hotel_result = await session.execute(hotel_stmt)
    hotel = hotel_result.scalar_one_or_none()
    
    room_stmt = select(Room).where(Room.id == room_id)
    room_result = await session.execute(room_stmt)
    room = room_result.scalar_one_or_none()
    
    if not hotel:
        raise_error(404, "找不到飯店")
    if not room:
        raise_error(404, "找不到房型")

    # 建立入住期間的日期清單 (退房日不算)
    current_day = start
    stay_dates: List[datetime.date] = []
    while current_day < end:
        stay_dates.append(current_day)
        current_day += timedelta(days=1)

    # 檢查庫存
    for d in stay_dates:
        existing_stmt = select(RoomInventory).where(
            RoomInventory.room_id == room_id,
            RoomInventory.date == d
        )
        existing_result = await session.execute(existing_stmt)
        existing = existing_result.scalar_one_or_none()
        
        if existing and existing.booked_rooms >= existing.total_rooms:
            raise_error(400, f"日期 {d} 庫存不足")

    # 扣除庫存
    for d in stay_dates:
        existing_stmt = select(RoomInventory).where(
            RoomInventory.room_id == room_id,
            RoomInventory.date == d
        )
        existing_result = await session.execute(existing_stmt)
        existing = existing_result.scalar_one_or_none()
        
        if existing:
            existing.booked_rooms += 1
            existing.updated_at = datetime.now()  # 移除時區
        else:
            new_inv = RoomInventory(
                room_id=room_id,
                date=d,
                total_rooms=1,  # 預設值
                booked_rooms=1,
                remaining_rooms=0,
                created_at=datetime.now(),  # 移除時區
                updated_at=datetime.now()   # 移除時區
            )
            session.add(new_inv)

    # 計算手續費
    service_fee = total_price * SERVICE_FEE_RATE
    total_price_with_fee = total_price + service_fee

    # 準備付款信息，符合Payment模型結構
    payment_data = data.get("payment", {})
    payment_info = {
        "method": payment_data.get("method", "on_site_payment"),
        "status": "pending",
        "transactionId": payment_data.get("transactionId", "")
    }

    order = Order(
        user_id=current_user["id"],
        hotel_id=hotel_id,
        room_id=room_id,
        check_in_date=start,
        check_out_date=end,
        total_price=total_price_with_fee,  
        status="pending",
        payment=payment_info,
        created_at=datetime.now(), 
        updated_at=datetime.now()  
    )
    session.add(order)
    await session.commit()
    await session.refresh(order)

    print(f"新訂單建立成功: room={room.title}, 價格含手續費={total_price_with_fee}")
    
    order_data = {
        "id": order.id,
        "userId": order.user_id,
        "hotelId": order.hotel_id,
        "roomId": order.room_id,
        "checkInDate": order.check_in_date,
        "checkOutDate": order.check_out_date,
        "totalPrice": order.total_price,
        "status": order.status,
        "payment": order.payment,
        "createdAt": order.created_at,
        "updatedAt": order.updated_at
    }
    
    return success(data=order_data, status=201)



# 更新訂單（by id）
async def update_order(order_id: int, data: Dict, session: AsyncSession):
    stmt = select(Order).where(Order.id == order_id)
    order_result = await session.execute(stmt)
    order = order_result.scalar_one_or_none()
    
    if not order:
        raise_error(404, "訂單不存在")

    status = data.get("status")
    if not status:
        raise_error(400, "缺少狀態欄位")

    valid_statuses = ["pending", "confirmed", "cancelled", "completed"]
    if status not in valid_statuses:
        raise_error(400, "無效的訂單狀態")

    order.status = status
    order.updated_at = datetime.now()  # 移除時區
    await session.commit()
    await session.refresh(order)
    
    order_data = {
        "id": order.id,
        "userId": order.user_id,
        "hotelId": order.hotel_id,
        "roomId": order.room_id,
        "checkInDate": order.check_in_date,
        "checkOutDate": order.check_out_date,
        "totalPrice": order.total_price,
        "status": order.status,
        "payment": order.payment,
        "createdAt": order.created_at,
        "updatedAt": order.updated_at
    }
    
    return success(data=order_data)


# 刪除訂單（釋放庫存）
async def delete_order(order_id: int, session: AsyncSession):
    stmt = select(Order).where(Order.id == order_id)
    order_result = await session.execute(stmt)
    order = order_result.scalar_one_or_none()
    
    if not order:
        raise_error(404, "訂單不存在")

    room_id = order.room_id
    check_in = order.check_in_date
    check_out = order.check_out_date

    await session.delete(order)
    await session.commit()

    # 释放庫存
    if room_id and check_in and check_out:
        try:
            if isinstance(check_in, str):
                start = datetime.strptime(check_in, "%Y-%m-%d").date()
            else:
                start = check_in
                
            if isinstance(check_out, str):
                end = datetime.strptime(check_out, "%Y-%m-%d").date()
            else:
                end = check_out

            current_day = start
            while current_day < end:
                existing_stmt = select(RoomInventory).where(
                    RoomInventory.room_id == room_id,
                    RoomInventory.date == current_day
                )
                existing_result = await session.execute(existing_stmt)
                existing = existing_result.scalar_one_or_none()
                
                if existing:
                    existing.booked_rooms = max(0, existing.booked_rooms - 1)
                    existing.remaining_rooms = existing.total_rooms - existing.booked_rooms
                    existing.updated_at = datetime.now()  
                    
                current_day += timedelta(days=1)
                
            await session.commit()
            print(f"已釋放庫存：roomId={room_id} from {start} to {end}")

        except Exception as e:
            print(f"釋放庫存時發生錯誤: {e}")

    return success(message="訂單刪除成功，庫存已釋放")
