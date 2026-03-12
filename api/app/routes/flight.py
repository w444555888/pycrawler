from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.services.flight_service import (
    search_flights,
    search_locations,
    create_flight_order,
    get_user_orders,
    get_order_detail,
    cancel_order,
    get_all_flight_orders,
)
from app.services.auth_service import verify_token

router = APIRouter(tags=["flights"])


# ----------- Search Locations -----------

@router.get("/locations/search")
async def route_search_locations(
    keyword: str = Query(...),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50)
):
    """搜尋機場和城市 (支持分頁)
    
    查询参数：
    - keyword: 搜尋關鍵詞 (必填)
    - page: 頁碼 (預設 1)
    - limit: 每頁結果數 (預設 10, 最多 50)
    """
    return await search_locations(keyword, page, limit)


# ----------- Search Flights -----------

@router.get("/search")
async def route_search_flights(
    origin: str = Query(...),
    destination: str = Query(...),
    date: str = Query(...),
    returnDate: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50)
):
    """搜尋航班 (支持分頁)
    
    查询参数：
    - origin: 出發地 IATA 代碼 (必填)
    - destination: 目的地 IATA 代碼 (必填)
    - date: 出發日期 YYYY-MM-DD (必填)
    - returnDate: 回程日期 YYYY-MM-DD (可選)
    - page: 頁碼 (預設 1)
    - limit: 每頁結果數 (預設 10, 最多 50)
    """
    return await search_flights(origin, destination, date, returnDate, page, limit)


# ----------- Flight Order 訂單 -----------

@router.post("/order")
async def route_create_order(payload: dict, current_user=Depends(verify_token)):
    return await create_flight_order(payload, current_user["id"])


@router.get("/orders/user")
async def route_get_orders_by_user(current_user=Depends(verify_token)):
    return await get_user_orders(current_user["id"])


@router.get("/orders/{order_id}")
async def route_get_order_detail_by_id(order_id: str):
    return await get_order_detail(order_id)


@router.post("/orders/{order_id}/cancel")
async def route_cancel_order_by_id(order_id: str, current_user=Depends(verify_token)):
    return await cancel_order(order_id, current_user["id"], current_user.get("isAdmin", False))


# ----------- Admin -----------

@router.get("/orders")
async def route_get_all_orders():
    return await get_all_flight_orders()