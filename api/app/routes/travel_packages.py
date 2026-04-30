from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.db import get_session
from app.services.auth_service import verify_token
from app.services.travel_package_service import (
    list_travel_packages,
    get_foursquare_place_detail
)
from app.services.foursquare_service import foursquare_service

router = APIRouter()


@router.get("/packages")
async def route_list_packages(
    city: Optional[str] = Query(None, description="城市过滤"),
    limit: int = Query(20, description="每页数量"),
    offset: int = Query(0, description="偏移量"),
    session: AsyncSession = Depends(get_session)
):
    """获取旅游套餐列表"""
    return await list_travel_packages(
        session=session,
        city=city,
        limit=limit,
        offset=offset
    )


@router.get("/packages/{fsq_place_id}")
async def api_get_foursquare_place_detail(fsq_place_id: str):
    return await get_foursquare_place_detail(fsq_place_id)


