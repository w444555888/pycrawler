# app/routes/hotels.py
from fastapi import APIRouter, Query, Depends
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_session
from app.services import hotel_service

router = APIRouter(tags=["hotels"])


# 獲取所有飯店資料（不帶任何過濾條件）
@router.get("")
async def get_all_hotels(session: AsyncSession = Depends(get_session)):
    return await hotel_service.get_all_hotels(session)



#獲取搜尋飯店資訊
@router.get("/search")
async def list_hotels(
    name: Optional[str] = Query(None),
    hotel_id: Optional[int] = Query(None, alias="hotelId"),
    popular: Optional[bool] = Query(None),
    min_price: Optional[float] = Query(None, alias="minPrice"),
    max_price: Optional[float] = Query(None, alias="maxPrice"),
    start_date: Optional[str] = Query(None, alias="startDate"),
    end_date: Optional[str] = Query(None, alias="endDate"),
    adult: Optional[int] = Query(None),
    room: Optional[int] = Query(None),
    session: AsyncSession = Depends(get_session)
):

    return await hotel_service.list_hotels(
        session=session,
        name=name,
        hotel_id=hotel_id,
        popular=popular,
        min_price=min_price,
        max_price=max_price,
        start_date=start_date,
        end_date=end_date,
        adult=adult,
        room=room,
    )

#獲取熱門飯店資訊 給首頁、精選區塊用
@router.get("/popular")
async def popular(session: AsyncSession = Depends(get_session)):
    return await hotel_service.get_popular_hotels(session)

#抓取其中一筆資料
@router.get("/find/{id}")
async def get_hotel(id: int, session: AsyncSession = Depends(get_session)):
    return await hotel_service.get_hotel(id, session)

#創建資料
@router.post("")
async def add_hotel(data: dict, session: AsyncSession = Depends(get_session)):
    return await hotel_service.create_hotel_service(data, session)

#修改資料
@router.put("/{id}")
async def edit_hotel(id: int, data: dict, session: AsyncSession = Depends(get_session)):
    return await hotel_service.update_hotel(id, data, session)

#刪除資料
@router.delete("/{id}")
async def delete_hotel(id: int, session: AsyncSession = Depends(get_session)):
    return await hotel_service.delete_hotel(id, session)

#模糊搜尋飯店名稱
@router.get("/suggestions")
async def get_name_suggestions(name: str, session: AsyncSession = Depends(get_session)):
    return await hotel_service.get_hotel_name_suggestions(session, name)
