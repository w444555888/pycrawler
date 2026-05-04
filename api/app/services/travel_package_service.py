import random
from fastapi import HTTPException
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from sqlalchemy.orm import selectinload
from typing import Dict, List, Optional
from app.utils.redis_client import get_cache, set_cache
from app.models.travel_package import TravelPackage
from app.models.user import User
from app.services.foursquare_service import foursquare_service
from app.utils.response import success
from app.utils.error_handler import raise_error
import secrets
import string


async def list_travel_packages(
    session: AsyncSession,
    city: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
):
    """通过 Foursquare 实时获取旅游套餐列表（UI layer only）"""
    try:
        if not city:
            raise_error(400, "必须指定城市(city)参数")

        cache_key = f"city_travel_data:{city}"
        city_data = await get_cache(cache_key)
        if not city_data:
            city_data = await foursquare_service.create_city_travel_data(city)
            await set_cache(cache_key, city_data, expire=3600)  # 1小时

        attractions = city_data.get("attractions", [])
        try:
            offset = int(offset)
            limit = int(limit)
        except Exception:
            raise_error(400, "分页参数 offset/limit 必须为整数")
        if offset < 0:
            offset = 0
        if limit <= 0:
            limit = 20
        packages = attractions[offset:offset+limit] if isinstance(attractions, list) else []
        return success(
            data={
                "packages": packages,
                "totalPlaces": city_data.get("total_places"),
                "generatedAt": city_data.get("generated_at"),
                "city": city_data.get("city"),
                "latitude": city_data.get("latitude"),
                "longitude": city_data.get("longitude"),
                "geo": city_data.get("geo")
            })
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise_error(500, f"获取套餐列表失败: {str(e)}")



async def get_foursquare_place_detail(fsq_place_id: str):
    """通过 Foursquare fsq_place_id 获取场馆详细信息，返回带有随机补充字段的数据，便于前端丰富展示"""
    try:
        detail = await foursquare_service.get_place_details(fsq_place_id)
        # 補充自訂隨機數據 因為 Foursquare 的免費 API 沒有完整字段
        if detail.get("rating") is None:
            detail["rating"] = round(random.uniform(3.8, 5.0), 1)
        if detail.get("price_level") is None:
            detail["price_level"] = random.choice([1, 2, 3, 4])
        detail["reviews_count"] = random.randint(20, 300)
        detail["is_open_now"] = random.choice([True, False])
        if not detail.get("description"):
            detail["description"] = random.choice([
                "本地人推荐的热门场所，适合休闲娱乐。",
                "环境优美，服务周到，是聚会的好去处。",
                "拥有独特氛围和丰富活动，值得一访。",
                "深受游客和居民喜爱的地标性场馆。"
            ])
        if not detail.get("phone"):
            detail["phone"] = f"0{random.randint(2,9)}-{random.randint(1000,9999)}-{random.randint(1000,9999)}"
        if not detail.get("website"):
            detail["website"] = random.choice([
                None,
                "https://www.example.com",
                "https://www.travelnow.com",
                "https://www.visitplace.com"
            ])
        detail["rating_breakdown"] = {
            "value": round(random.uniform(3.5, 5.0), 1),
            "service": round(random.uniform(3.5, 5.0), 1),
            "environment": round(random.uniform(3.5, 5.0), 1),
            "itinerary": round(random.uniform(3.5, 5.0), 1)
        }
        detail["price_breakdown"] = {
            "base_price": random.randint(80, 200),
            "currency": "USD"
        }
        detail["included_services"] = ["景点门票", "导游讲解"]
        detail["excluded_services"] = ["交通", "餐饮"]
        detail["itinerary"] = [
            {
                "day": 1,
                "title": f"{detail.get('name', '景点')} 一日游",
                "description": "上午游览主要景点，下午自由活动。",
                "attractions": [detail.get("name", "景点")],
                "estimated_cost": detail["price_breakdown"]["base_price"]
            }
        ]
        detail["reviews"] = [
            {
                "user": f"游客{random.randint(1000,9999)}",
                "rating": round(random.uniform(4.0, 5.0), 1),
                "content": random.choice([
                    "体验很棒，推荐！",
                    "风景优美，服务好。",
                    "下次还会再来。"
                ]),
                "created_at": datetime.now().isoformat()
            }
            for _ in range(random.randint(2, 5))
        ]
        return success(data=detail)
    except Exception as e:
        print(f"获取Foursquare场馆详情失败: {e}")
        raise_error(500, f"获取Foursquare场馆详情失败: {str(e)}")
