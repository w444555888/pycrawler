import random
import hashlib
from fastapi import HTTPException
from datetime import datetime, timezone
from typing import Dict, Optional, List
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.services.aviationstack_service import AviationstackService
from app.models.real_flight_orders import RealFlightOrders
from app.utils.response import success
from app.utils.error_handler import raise_error

aviationstack = AviationstackService()


async def search_locations(keyword: str, page: int = 1, limit: int = 10):
    """
    搜尋機場和地點 (模糊搜尋)
    
    用於協助用戶選擇出發地和目的地
    支援機場代碼、城市名稱等搜尋
    支持分頁查詢
    
    參數:
        keyword: 搜尋關鍵詞 (例: "LAX", "Los Angeles", "紐約")
        page: 頁碼 (預設 1)
        limit: 每頁結果數 (預設 10)
    
    返回:
        {
            "code": 0,
            "message": "Success",
            "data": [
                {
                    "iataCode": "LAX",
                    "name": "Los Angeles",
                    "type": "AIRPORT",
                    "country": "US",
                    "countryName": "United States"
                }
            ],
            "pagination": {
                "page": 1,
                "limit": 10,
                "total": 28,
                "totalPages": 3,
                "hasNext": true
            }
        }
    """
    try:
        if not keyword or len(keyword.strip()) < 2:
            raise_error(400, "搜尋關鍵詞至少需要 2 個字符")
        
        if page < 1:
            raise_error(400, "頁碼必須大於 0")
        
        if limit < 1 or limit > 50:
            raise_error(400, "每頁結果數必須在 1 到 50 之間")
        
        result = await aviationstack.search_locations(keyword.strip(), page, limit)
        
        if "error" in result:
            raise_error(400, f"搜尋失敗: {result['error']}")
        
        meta = result.get("meta", {})
        locations = result.get("location_results", [])
        
        pagination_info = {
            "page": meta.get("page", page),
            "limit": meta.get("limit", limit),
            "total": meta.get("count", 0),
            "totalPages": meta.get("totalPages", 0),
            "hasNext": meta.get("links", {}).get("next") is not None
        }
        
        return success(
            data={
                "items": locations,
                "pagination": pagination_info
            }
        )
    
    except Exception as e:
        raise_error(400, f"搜尋地點失敗: {str(e)}")



def generate_price(flight_info):
    seed_str = f"{flight_info.get('flightId')}_{flight_info.get('flightDate')}_{flight_info.get('departureAirport')}_{flight_info.get('arrivalAirport')}"
    num = sum(ord(c) for c in seed_str)
    base = 1000 + (num % 9000)   # 1000 ~ 10000
    tax = int(base * 0.1)

    return {
        "basePrice": base,
        "tax": tax,
        "totalPrice": base + tax
    }


def generate_seats(flight_info):
    seed_str = f"{flight_info.get('flightId')}_{flight_info.get('flightDate')}"
    num = sum(ord(c) for c in seed_str)
    return 10 + (num % 91)   # 10 ~ 100



def convert_aviationstack_to_flight_info(f: Dict) -> Dict:
    departure = f.get("departure", {})
    arrival = f.get("arrival", {})
    airline = f.get("airline", {})
    flight = f.get("flight", {})
    aircraft = f.get("aircraft") or {}
    flight_id = (
        flight.get("iata")
        or flight.get("icao")
        or f"{departure.get('iata')}_{arrival.get('iata')}_{f.get('flight_date')}"
    )   # 優先使用 IATA，次選 ICAO，最後用組合鍵

    flight_info = {
        "flightId": flight_id,
        "flightDate": f.get("flight_date"),
        "flightNumber": flight.get("iata"),
        "flightNumberRaw": flight.get("number"),
        "flightICAO": flight.get("icao"),
        "airline": airline.get("name"),
        "airlineIATA": airline.get("iata"),
        "departureAirport": departure.get("iata"),
        "arrivalAirport": arrival.get("iata"),
        "departureTime": departure.get("scheduled"),
        "departureEstimated": departure.get("estimated"),
        "departureActual": departure.get("actual"),
        "arrivalTime": arrival.get("scheduled"),
        "arrivalEstimated": arrival.get("estimated"),
        "arrivalActual": arrival.get("actual"),
        "departureTerminal": departure.get("terminal"),
        "departureGate": departure.get("gate"),
        "arrivalTerminal": arrival.get("terminal"),
        "aircraftCode": aircraft.get("icao24"),
        "codeshare": flight.get("codeshared"),
        "itineraryDuration": None,
    }

    flight_info["availableSeats"] = generate_seats(flight_info)

    return flight_info


async def search_flights(origin, destination, date, returnDate=None, page: int = 1, limit: int = 10):

    if page < 1:
        raise_error(400, "頁碼必須大於 0")

    if limit < 1 or limit > 50:
        raise_error(400, "每頁結果數必須在 1 到 50 之間")

    data = await aviationstack.search_flights(origin, destination, date)

    flights = []

    for f in data:   
        try:
            flight_info = convert_aviationstack_to_flight_info(f)

            flights.append({
                "flightInfo": flight_info,
                "price": generate_price(flight_info),
                "tripType": "roundtrip" if returnDate else "oneway"
            })

        except Exception as e:
            print("解析錯誤:", e)
            continue

    total_count = len(flights)
    total_pages = (total_count + limit - 1) // limit

    start = (page - 1) * limit
    end = start + limit

    return success(data={
        "items": flights[start:end],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total_count,
            "totalPages": total_pages,
            "hasNext": page < total_pages
        }
    })


# 建立飛行訂單
async def create_flight_order(payload: Dict, user_id: int, session: AsyncSession):
    """
    建立新的飛行訂單
    payload 格式: {
        "flightInfo": { "flightNumber": "...", "airline": "...", "departureAirport": "...", "arrivalAirport": "...", "departureTime": "...", "arrivalTime": "..." },
        "passengerInfo": [ { "name": "...", "gender": 0/1, "birthDate": "...", "passportNumber": "...", "email": "..." } ],
        "category": "ECONOMY",
        "price": { "basePrice": 100, "tax": 10, "totalPrice": 110 }
    }
    """
    try:
        # 驗證必填欄位
        flight_info = payload.get("flightInfo")
        passenger_info = payload.get("passengerInfo")
        category = payload.get("category")
        price = payload.get("price")

        if not flight_info or not passenger_info or not category or not price:
            raise_error(400, "缺少必要欄位: flightInfo, passengerInfo, category, price")

        if category not in ["ECONOMY", "BUSINESS", "FIRST"]:
            raise_error(400, "無效的艙等: 必須為 ECONOMY, BUSINESS 或 FIRST")

        # 產生訂單號
        order_number = f"FO-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:8].upper()}"

        # 建立訂單物件
        flight_order = RealFlightOrders(
            user_id=user_id,
            order_number=order_number,
            flight_info=flight_info,
            passenger_info=passenger_info,
            category=category,
            price=price,
            status="PENDING",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        session.add(flight_order)
        await session.commit()
        await session.refresh(flight_order)
        
        result = {
            "id": flight_order.id,
            "userId": flight_order.user_id,
            "orderNumber": flight_order.order_number,
            "flightInfo": flight_order.flight_info,
            "passengerInfo": flight_order.passenger_info,
            "category": flight_order.category,
            "price": flight_order.price,
            "status": flight_order.status,
            "createdAt": flight_order.created_at,
            "updatedAt": flight_order.updated_at
        }
        return success(data=result, status=201)

    except Exception as e:
        raise_error(400, str(e))


# 取得使用者的所有訂單
async def get_user_orders(user_id: int, session: AsyncSession):
    """
    取得特定使用者的所有飛行訂單
    """
    try:
        stmt = select(RealFlightOrders).where(RealFlightOrders.user_id == user_id)
        result_query = await session.execute(stmt)
        orders = result_query.scalars().all()

        result = []
        for order in orders:
            data = {
                "id": order.id,
                "userId": order.user_id,
                "orderNumber": order.order_number,
                "flightInfo": order.flight_info,
                "passengerInfo": order.passenger_info,
                "category": order.category,
                "price": order.price,
                "status": order.status,
                "paymentInfo": order.payment_info,
                "createdAt": order.created_at,
                "updatedAt": order.updated_at
            }
            result.append(data)

        return success(data=result)

    except Exception as e:
        raise_error(400, f"查詢訂單失敗: {str(e)}")


# 取得單一訂單詳情
async def get_order_detail(order_id: int, session: AsyncSession):
    """
    取得單一飛行訂單的詳細資訊
    """
    try:
        stmt = select(RealFlightOrders).where(RealFlightOrders.id == order_id)
        result_query = await session.execute(stmt)
        order = result_query.scalar_one_or_none()
        
        if not order:
            raise_error(404, "訂單找不到")

        result = {
            "id": order.id,
            "userId": order.user_id,
            "orderNumber": order.order_number,
            "flightInfo": order.flight_info,
            "passengerInfo": order.passenger_info,
            "category": order.category,
            "price": order.price,
            "status": order.status,
            "paymentInfo": order.payment_info,
            "createdAt": order.created_at,
            "updatedAt": order.updated_at
        }
        return success(data=result)
    
    except Exception as e:
        raise_error(400, str(e))


# 取消訂單
async def cancel_order(order_id: int, user_id: int, is_admin: bool, session: AsyncSession):
    """
    取消飛行訂單
    只有訂單所有者或管理員可以取消訂單
    """
    try:
        stmt = select(RealFlightOrders).where(RealFlightOrders.id == order_id)
        result_query = await session.execute(stmt)
        order = result_query.scalar_one_or_none()
        
        if not order:
            raise_error(404, "訂單找不到")

        # 驗證權限: 必須是訂單所有者或管理員
        if order.user_id != user_id and not is_admin:
            raise_error(403, "無權限取消此訂單")

        # 若已支付或已完成不能取消
        if order.status in ["PAID", "COMPLETED"]:
            raise_error(400, f"無法取消狀態為 {order.status} 的訂單")

        # 更新訂單狀態與時間戳
        order.status = "CANCELLED"
        order.updated_at = datetime.now()
        await session.commit()

        result = {
            "id": order.id,
            "userId": order.user_id,
            "orderNumber": order.order_number,
            "flightInfo": order.flight_info,
            "passengerInfo": order.passenger_info,
            "category": order.category,
            "price": order.price,
            "status": order.status,
            "paymentInfo": order.payment_info,
            "createdAt": order.created_at,
            "updatedAt": order.updated_at
        }
        return success(data=result)
        
    except Exception as e:
        raise_error(400, str(e))


# 取得所有飛行訂單 (管理者用)
async def get_all_flight_orders(session: AsyncSession):
    """
    取得所有飛行訂單 (管理員功能)
    """
    try:
        stmt = select(RealFlightOrders)
        result_query = await session.execute(stmt)
        orders = result_query.scalars().all()

        result = []
        for order in orders:
            data = {
                "id": order.id,
                "userId": order.user_id,
                "orderNumber": order.order_number,
                "flightInfo": order.flight_info,
                "passengerInfo": order.passenger_info,
                "category": order.category,
                "price": order.price,
                "status": order.status,
                "paymentInfo": order.payment_info,
                "createdAt": order.created_at,
                "updatedAt": order.updated_at
            }
            result.append(data)

        return success(data=result)

    except Exception as e:
        raise_error(400, f"查詢訂單失敗: {str(e)}")