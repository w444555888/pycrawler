from fastapi import HTTPException
from datetime import datetime, timezone
from beanie import PydanticObjectId
from bson import ObjectId
from typing import Dict, Optional, List
import uuid

from app.services.amadeus_service import AmadeusService
from app.models.real_flight_orders import RealFlightOrders
from app.utils.response import success
from app.utils.error_handler import raise_error

amadeus = AmadeusService()


async def search_locations(keyword: str):
    """
    搜尋機場和地點 (模糊搜尋)
    
    用於協助用戶選擇出發地和目的地
    支援機場代碼、城市名稱等搜尋
    
    參數:
        keyword: 搜尋關鍵詞 (例: "LAX", "Los Angeles", "紐約")
    
    返回:
        {
            "data": [
                {
                    "iataCode": "LAX",
                    "name": "Los Angeles",
                    "type": "AIRPORT",
                    "country": "US",
                    "countryName": "United States"
                }
            ]
        }
    """
    try:
        if not keyword or len(keyword.strip()) < 2:
            raise_error(400, "搜尋關鍵詞至少需要 2 個字符")
        
        result = await amadeus.search_locations(keyword.strip())
        
        if "error" in result:
            raise_error(400, f"搜尋失敗: {result['error']}")
        
        return success(data=result.get("location_results", []))
    
    except Exception as e:
        raise_error(400, f"搜尋地點失敗: {str(e)}")


def convert_amadeus_to_flight_info(amadeus_flight: Dict) -> Dict:
    """
    將 Amadeus API 返回的飛行數據轉換為 FlightInfo 格式
    
    改進後的格式包含中文鍵名:
    {
        "航班ID (flight id)": "...",
        "行程 (itineraries)": [{
            "行程總時間 (duration)": "PT10H30M",
            "航段 (segments)": [{
                "航空公司代碼 (carrierCode)": "AA",
                "航班號碼 (number)": "123",
                "飛機型號 (aircraft)": {"code": "B777"},
                "航段時間 (duration)": "PT5H30M",
                "出發地 (departure)": {"at": "2024-03-11T10:00:00", "iataCode": "LAX"},
                "目的地 (arrival)": {"at": "2024-03-11T14:00:00", "iataCode": "JFK"}
            }]
        }],
        "可訂座位數 (numberOfBookableSeats)": 5,
        "價格資訊 (price)": {"total": "299.99"}
    }
    
    返回 FlightInfo 格式:
    {
        "flightId": "...",
        "flightNumber": "AA123",
        "airline": "American Airlines",
        "departureAirport": "LAX",
        "arrivalAirport": "JFK",
        "departureTime": datetime,
        "arrivalTime": datetime,
        "aircraftCode": "B777",
        "itineraryDuration": "PT10H30M",
        "availableSeats": 5
    }
    """
    try:
        segment = amadeus_flight["行程 (itineraries)"][0]["航段 (segments)"][0]
        itinerary = amadeus_flight["行程 (itineraries)"][0]
        
        # 解析時間
        departure_time = datetime.fromisoformat(segment["出發地 (departure)"]["at"].replace("Z", "+00:00"))
        arrival_time = datetime.fromisoformat(segment["目的地 (arrival)"]["at"].replace("Z", "+00:00"))
        
        flight_number = segment["航空公司代碼 (carrierCode)"] + segment["航班號碼 (number)"]
        
        # 航空公司名稱對應表 (可根據實際情況擴展)
        airline_names = {
            "AA": "American Airlines",
            "DL": "Delta Airlines",
            "UA": "United Airlines",
            "SW": "Southwest Airlines",
            "BA": "British Airways",
            "LH": "Lufthansa",
            "AF": "Air France",
            "KL": "KLM"
        }
        
        airline = airline_names.get(segment["航空公司代碼 (carrierCode)"], segment["航空公司代碼 (carrierCode)"])
        
        # 提取飛機型號
        aircraft_code = None
        if "飛機型號 (aircraft)" in segment:
            aircraft_code = segment["飛機型號 (aircraft)"].get("code")
        
        return {
            "flightId": amadeus_flight.get("航班ID (flight id)"),
            "flightNumber": flight_number,
            "airline": airline,
            "departureAirport": segment["出發地 (departure)"]["iataCode"],
            "arrivalAirport": segment["目的地 (arrival)"]["iataCode"],
            "departureTime": departure_time,
            "arrivalTime": arrival_time,
            "aircraftCode": aircraft_code,
            "itineraryDuration": itinerary.get("行程總時間 (duration)"),
            "availableSeats": amadeus_flight.get("可訂座位數 (numberOfBookableSeats)")
        }
    except (KeyError, ValueError) as e:
        raise_error(400, f"無法解析飛行數據: {str(e)}")


async def search_flights(origin, destination, date, returnDate=None):
    """
    搜尋航班
    
    參數:
        origin: 出發地 IATA 代碼
        destination: 目的地 IATA 代碼
        date: 出發日期 (YYYY-MM-DD)
        returnDate: 回程日期 (YYYY-MM-DD，可選，如果提供表示搜尋來回航班)
    """
    # 調用 Amadeus 服務搜尋航班，傳遞 returnDate
    data = await amadeus.search_flights(origin, destination, date, returnDate)

    flights = []

    for f in data.get("航班搜尋結果 (flights)", []):
        try:
            # 轉換數據格式
            flight_info = convert_amadeus_to_flight_info(f)
            
            # 提取價格資訊 (Amadeus返回總價，暫時假設沒有稅額)
            price_info = f.get("價格資訊 (price)", {})
            total_price = float(price_info.get("total", 0))
            base_price = total_price * 0.9  # 假設稅費為10%
            tax = total_price * 0.1
            
            flights.append({
                "flightInfo": flight_info,
                "price": {
                    "basePrice": round(base_price, 2),
                    "tax": round(tax, 2),
                    "totalPrice": total_price
                },
                "tripType": "roundtrip" if returnDate else "oneway"
            })
        except Exception as e:
            # 忽略無法解析的飛行數據
            print(f"警告: 無法解析飛行數據 - {str(e)}")
            continue

    return success(data=flights)


# 建立飛行訂單
async def create_flight_order(payload: Dict, user_id: str):
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
            user_id=PydanticObjectId(user_id),
            order_number=order_number,
            flight_info=flight_info,
            passenger_info=passenger_info,
            category=category,
            price=price,
            status="PENDING",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )

        await flight_order.insert()
        result = flight_order.model_dump(by_alias=True, exclude_none=True)
        result["userId"] = str(flight_order.user_id)
        return success(data=result, status=201)

    except Exception as e:
        raise_error(400, str(e))


# 取得使用者的所有訂單
async def get_user_orders(user_id: str):
    """
    取得特定使用者的所有飛行訂單
    """
    try:
        user_oid = PydanticObjectId(user_id)
        orders = await RealFlightOrders.find(RealFlightOrders.user_id == user_oid).to_list()

        result = []
        for order in orders:
            data = order.model_dump(by_alias=True, exclude_none=True)
            data["userId"] = str(order.user_id)
            data["id"] = str(order.id)
            result.append(data)

        return success(data=result)

    except Exception as e:
        raise_error(400, f"查詢訂單失敗: {str(e)}")


# 取得單一訂單詳情
async def get_order_detail(order_id: str):
    """
    取得單一飛行訂單的詳細資訊
    """
    try:
        oid = PydanticObjectId(order_id)
    except Exception:
        raise_error(400, "訂單 id 格式不正確")

    order = await RealFlightOrders.get(oid)
    if not order:
        raise_error(404, "訂單找不到")

    result = order.model_dump(by_alias=True, exclude_none=True)
    result["userId"] = str(order.user_id)
    result["id"] = str(order.id)
    return success(data=result)


# 取消訂單
async def cancel_order(order_id: str, user_id: str, is_admin: bool):
    """
    取消飛行訂單
    只有訂單所有者或管理員可以取消訂單
    """
    try:
        oid = PydanticObjectId(order_id)
        user_oid = PydanticObjectId(user_id)
    except Exception:
        raise_error(400, "id 格式不正確")

    order = await RealFlightOrders.get(oid)
    if not order:
        raise_error(404, "訂單找不到")

    # 驗證權限: 必須是訂單所有者或管理員
    if order.user_id != user_oid and not is_admin:
        raise_error(403, "無權限取消此訂單")

    # 若已支付或已完成不能取消
    if order.status in ["PAID", "COMPLETED"]:
        raise_error(400, f"無法取消狀態為 {order.status} 的訂單")

    # 更新訂單狀態與時間戳
    order.status = "CANCELLED"
    order.updated_at = datetime.now(timezone.utc)
    await order.save()

    result = order.model_dump(by_alias=True, exclude_none=True)
    result["userId"] = str(order.user_id)
    result["id"] = str(order.id)
    return success(data=result)


# 取得所有飛行訂單 (管理者用)
async def get_all_flight_orders():
    """
    取得所有飛行訂單 (管理員功能)
    """
    try:
        orders = await RealFlightOrders.find_all().to_list()

        result = []
        for order in orders:
            data = order.model_dump(by_alias=True, exclude_none=True)
            data["userId"] = str(order.user_id)
            data["id"] = str(order.id)
            result.append(data)

        return success(data=result)

    except Exception as e:
        raise_error(400, f"查詢訂單失敗: {str(e)}")