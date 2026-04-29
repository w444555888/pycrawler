from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.db import get_session
from app.services.auth_service import verify_token
from app.services.travel_package_service import (
    list_travel_packages,
    get_travel_package,
    create_travel_package_from_city,
    create_manual_travel_package,
    update_travel_package,
    delete_travel_package,
    create_package_booking,
    get_package_categories,
    search_packages_by_foursquare
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


@router.get("/packages/{package_id}")
async def route_get_package(
    package_id: int,
    session: AsyncSession = Depends(get_session)
):
    """获取单个旅游套餐详情"""
    return await get_travel_package(package_id, session)


@router.post("/packages/from-city")
async def route_create_package_from_city(
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    """基于城市自动创建旅游套餐"""
    data = await request.json()
    city = data.get("city")
    
    if not city:
        from app.utils.error_handler import raise_error
        raise_error(400, "城市名称不能为空")
    
    return await create_travel_package_from_city(city, session)


@router.post("/packages/manual")
async def route_create_manual_package(
    request: Request,
    current_user=Depends(verify_token),
    session: AsyncSession = Depends(get_session)
):
    """手动创建旅游套餐（需要管理员权限）"""
    if not current_user.get("isAdmin", False):
        from app.utils.error_handler import raise_error
        raise_error(403, "需要管理员权限")
    
    data = await request.json()
    return await create_manual_travel_package(data, session)


@router.put("/packages/{package_id}")
async def route_update_package(
    package_id: int,
    request: Request,
    current_user=Depends(verify_token),
    session: AsyncSession = Depends(get_session)
):
    """更新旅游套餐（需要管理员权限）"""
    if not current_user.get("isAdmin", False):
        from app.utils.error_handler import raise_error
        raise_error(403, "需要管理员权限")
    
    data = await request.json()
    return await update_travel_package(package_id, data, session)


@router.delete("/packages/{package_id}")
async def route_delete_package(
    package_id: int,
    current_user=Depends(verify_token),
    session: AsyncSession = Depends(get_session)
):
    """删除旅游套餐（需要管理员权限）"""
    if not current_user.get("isAdmin", False):
        from app.utils.error_handler import raise_error
        raise_error(403, "需要管理员权限")
    
    return await delete_travel_package(package_id, session)


@router.post("/packages/{package_id}/book")
async def route_book_package(
    package_id: int,
    request: Request,
    current_user=Depends(verify_token),
    session: AsyncSession = Depends(get_session)
):
    """预订旅游套餐"""
    data = await request.json()
    return await create_package_booking(package_id, data, current_user, session)


@router.get("/packages/categories/stats")
async def route_get_categories(session: AsyncSession = Depends(get_session)):
    """获取套餐分类统计"""
    return await get_package_categories(session)


@router.get("/packages/search/foursquare")
async def route_search_foursquare(
    query: str = Query(..., description="搜索关键词"),
    near: str = Query(..., description="地点"),
    session: AsyncSession = Depends(get_session)
):
    """使用 Foursquare 搜索相关套餐"""
    return await search_packages_by_foursquare(query, near, session)


# Foursquare API 直接调用路由
@router.get("/foursquare/places/search")
async def route_foursquare_search(
    query: Optional[str] = Query(None, description="搜索关键词"),
    near: Optional[str] = Query(None, description="地点"),
    ll: Optional[str] = Query(None, description="经纬度"),
    categories: Optional[str] = Query(None, description="分类ID"),
    limit: int = Query(20, description="结果数量"),
    radius: int = Query(10000, description="搜索半径（米）")
):
    """直接搜索 Foursquare 地点"""
    return await foursquare_service.search_places(
        query=query,
        near=near,
        ll=ll,
        categories=categories,
        limit=limit,
        radius=radius
    )


@router.get("/foursquare/places/{fsq_id}")
async def route_foursquare_place_detail(fsq_id: str):
    """获取 Foursquare 地点详情"""
    return await foursquare_service.get_enhanced_place_info(fsq_id)


@router.get("/foursquare/places/{fsq_id}/photos")
async def route_foursquare_photos(
    fsq_id: str,
    limit: int = Query(10, description="照片数量")
):
    """获取 Foursquare 地点照片"""
    photos = await foursquare_service.get_place_photos(fsq_id, limit)
    return {"photos": photos}


@router.get("/foursquare/attractions/{city}")
async def route_foursquare_attractions(
    city: str,
    limit: int = Query(20, description="结果数量"),
    radius: int = Query(15000, description="搜索半径（米）")
):
    """搜索城市景点"""
    attractions = await foursquare_service.search_attractions(city, limit, radius)
    return {"city": city, "attractions": attractions}


@router.get("/foursquare/restaurants/{city}")
async def route_foursquare_restaurants(
    city: str,
    cuisine_type: Optional[str] = Query(None, description="菜系类型"),
    limit: int = Query(20, description="结果数量"),
    radius: int = Query(10000, description="搜索半径（米）")
):
    """搜索城市餐厅"""
    restaurants = await foursquare_service.search_restaurants(city, cuisine_type, limit, radius)
    return {"city": city, "cuisine_type": cuisine_type, "restaurants": restaurants}


@router.get("/foursquare/hotels/{city}")
async def route_foursquare_hotels(
    city: str,
    limit: int = Query(20, description="结果数量"),
    radius: int = Query(15000, description="搜索半径（米）")
):
    """搜索城市酒店"""
    hotels = await foursquare_service.search_hotels(city, limit, radius)
    return {"city": city, "hotels": hotels}


@router.get("/foursquare/city-data/{city}")
async def route_foursquare_city_data(city: str):
    """获取城市完整旅游数据"""
    return await foursquare_service.create_city_travel_data(city)