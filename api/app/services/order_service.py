from fastapi import HTTPException
from datetime import datetime, timezone, timedelta

from datetime import datetime, timezone
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
async def list_orders():
    orders = await Order.find_all().to_list()
    result = []

    for o in orders:
        hotel_id = ""
        hotel_name = ""
        room_id = ""
        room_title = ""

        if isinstance(o.hotel_id, Link):
            hotel_id = str(o.hotel_id.ref.id)
        else:
            hotel_id = str(o.hotel_id)

        if hotel_id:
            hotel = await Hotel.get(hotel_id)
            if hotel:
                hotel_name = hotel.name

        if isinstance(o.room_id, Link):
            room_id = str(o.room_id.ref.id)
        else:
            room_id = str(o.room_id)

        if room_id:
            room = await Room.get(room_id)
            if room:
                room_title = room.title

        data = o.model_dump(by_alias=True, exclude_none=True)
        data["userId"] = str(o.user_id)
        data["hotelId"] = hotel_id
        data["hotelName"] = hotel_name
        data["roomId"] = room_id
        data["roomTitle"] = room_title
        result.append(data)

    return success(data=result)





# 根據 ID 取得單一訂單（含 hotel、room）
async def get_order(order_id: str):
    try:
        oid = PydanticObjectId(order_id)
    except Exception:
        raise_error(400, "訂單 id 格式不正確")

    order = await Order.get(oid, fetch_links=True)  # ← 等同兩個 populate
    if not order:
        raise_error(404, "訂單找不到")

    return success(data=order)



# 新訂單（含庫存檢查與手續費計算）
async def create_order(data: Dict, current_user: User):
    hotel_id = data.get("hotelId")
    room_id = data.get("roomId")
    total_price = data.get("totalPrice")
    check_in = data.get("checkInDate")
    check_out = data.get("checkOutDate")

    if not hotel_id or not room_id or not total_price or not check_in or not check_out:
        raise_error(400, "缺少必要欄位")

    # 轉日期型別
    try:
        start = datetime.strptime(check_in, "%Y-%m-%d").date()
        end = datetime.strptime(check_out, "%Y-%m-%d").date()
    except Exception:
        raise_error(400, "日期格式錯誤，請使用 YYYY-MM-DD")

    if end <= start:
        raise_error(400, "退房日必須晚於入住日")

    # 驗證飯店與房型存在
    hotel = await Hotel.get(ObjectId(hotel_id))
    room = await Room.get(ObjectId(room_id))
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
    inventories = await RoomInventory.find({
        "roomId": ObjectId(room_id),
        "date": {"$in": stay_dates}
    }).to_list()

    insufficient = next((inv for inv in inventories if inv.booked_rooms >= inv.total_rooms), None)
    if insufficient:
        raise_error(400, f"日期 {insufficient.date} 庫存不足")

    # 扣除庫存
    for d in stay_dates:
        existing = await RoomInventory.find_one(
            RoomInventory.room_id == ObjectId(room_id),
            RoomInventory.date == d
        )
        if existing:
            existing.booked_rooms += 1
            existing.update_timestamp()
            await existing.save()
        else:
            new_inv = RoomInventory(
                room_id=ObjectId(room_id),
                date=d,
                total_rooms=room.total_rooms if hasattr(room, "total_rooms") else 1,
                booked_rooms=1
            )
            await new_inv.insert()

    # 計算手續費
    service_fee = total_price * SERVICE_FEE_RATE
    total_price_with_fee = total_price + service_fee

    # 刪掉舊的 totalPrice，避免重複
    data.pop("totalPrice", None)

    # 建立訂單
    order = Order(
        **data,
        userId=str(current_user["id"]),
        totalPrice=total_price_with_fee,
        createdAt=datetime.now(timezone.utc)
    )
    await order.insert()

    print(f"新訂單建立成功: room={room.title}, 價格含手續費={total_price_with_fee}")
    return success(data=order, status=201)



# 更新訂單（by id）
async def update_order(order_id: str, data: Dict):
    order = await Order.get(order_id)
    if not order:
        raise_error(404, "訂單不存在")

    status = data.get("status")
    if not status:
        raise_error(400, "缺少狀態欄位")

    valid_statuses = ["pending", "confirmed", "cancelled", "completed"]
    if status not in valid_statuses:
        raise_error(400, "無效的訂單狀態")

    order.status = status
    await order.save()
    return success(data=order)



# 刪除訂單（釋放庫存）
async def delete_order(order_id: str):
    order = await Order.get(order_id)
    if not order:
        raise_error(404, "訂單不存在")

    room_id = order.room_id
    check_in = order.check_in_date
    check_out = order.check_out_date

    await order.delete()

    if room_id and check_in and check_out:
        try:
            start = datetime.strptime(check_in, "%Y-%m-%d").date()
            end = datetime.strptime(check_out, "%Y-%m-%d").date()

            current_day = start
            while current_day < end:
                existing = await RoomInventory.find_one(
                    RoomInventory.room_id == ObjectId(room_id),
                    RoomInventory.date == current_day
                )
                if existing:
                    existing.booked_rooms = max(0, existing.booked_rooms - 1)
                    await existing.save()
                current_day += timedelta(days=1)

            print(f"已釋放庫存：roomId={room_id} from {check_in} to {check_out}")

        except Exception as e:
            print(f"釋放庫存時發生錯誤: {e}")

    return success(message="訂單刪除成功，庫存已釋放")
