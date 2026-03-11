from fastapi import APIRouter, Depends, Query
from app.services.flight_service import (
    search_flights,
    create_flight_order,
    get_user_orders,
    get_order_detail,
    cancel_order,
    get_all_flight_orders,
)
from app.services.auth_service import verify_token

router = APIRouter(tags=["flights"])


# ----------- Search Flights -----------

@router.get("/search")
async def route_search_flights(
    origin: str = Query(...),
    destination: str = Query(...),
    date: str = Query(...)
):
    return await search_flights(origin, destination, date)


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