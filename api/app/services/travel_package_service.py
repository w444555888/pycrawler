import random
from fastapi import HTTPException
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from sqlalchemy.orm import selectinload
from typing import Dict, List, Optional
from app.models.travel_package import TravelPackage, TravelPackageBooking, TravelPackageReview
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

        city_data = await foursquare_service.create_city_travel_data(city)
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



async def get_travel_package(package_id: str, session: AsyncSession):
    """通过 Foursquare 实时获取单个旅游套餐详情，不查数据库"""
    try:
        # 假设 package_id 格式为 city_idx
        if '_' not in package_id:
            raise_error(400, "套餐ID格式错误")
        city, idx = package_id.rsplit('_', 1)
        idx = int(idx)
        city_data = await foursquare_service.create_city_travel_data(city)
        attractions = city_data.get("attractions", [])
        lat = city_data.get("latitude")
        lng = city_data.get("longitude")
        geo = city_data.get("geo")
        if idx < 0 or idx >= len(attractions):
            raise_error(404, "旅游套餐不存在")
        attr = attractions[idx]
        package_data = {
            "id": package_id,
            "name": f"{city}打卡：{attr.get('name', '未知景点')}",
            "description": attr.get('description', ''),
            "shortDescription": attr.get('name', ''),
            "city": city,
            "country": city_data.get('country', 'Unknown'),
            "latitude": lat,
            "longitude": lng,
            "geo": geo,
            "city_location": city_data.get("location", {}),
            "coordinates": attr.get('coordinates'),
            "attraction_location": attr.get("location", {}),
            "attraction_categories": attr.get("categories", []),
            "durationDays": 1,
            "maxParticipants": 20,
            "minParticipants": 1,
            "difficultyLevel": "easy",
            "category": "cultural",
            "priceBreakdown": {
                "base_price": 100,
                "total_price": 100,
                "currency": "USD"
            },
            "itinerary": [],
            "weatherInfo": None,
            "photos": attr.get('photos', []),
            "includedServices": ["景点门票"],
            "excludedServices": ["交通", "餐饮"],
            "featured": False,
            "rating": attr.get('rating'),
            "reviewsCount": attr.get('reviewsCount'),
            "bookingCount": 0,
            "createdAt": None,
            "updatedAt": None
        }
        return success(data=package_data)
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise e
        print(f"获取套餐详情失败: {e}")
        raise_error(500, f"获取套餐详情失败: {str(e)}")


async def create_travel_package_from_city(city: str, session: AsyncSession):
    """基于城市自动创建旅游套餐"""
    try:
        # 使用 Foursquare API 获取城市数据
        city_data = await foursquare_service.create_city_travel_data(city)
        
        attractions = city_data.get("attractions", [])
        restaurants = city_data.get("restaurants", [])
        
        if not attractions:
            raise_error(400, f"无法找到 {city} 的景点信息")
        
        # 生成行程安排（每天安排2-3个景点和1-2个餐厅）
        itinerary = []
        attractions_per_day = 2
        restaurants_per_day = 1
        
        # 计算建议的旅行天数
        suggested_days = min(max(len(attractions) // attractions_per_day, 1), 7)
        
        for day in range(1, suggested_days + 1):
            start_idx = (day - 1) * attractions_per_day
            end_idx = start_idx + attractions_per_day
            day_attractions = attractions[start_idx:end_idx]
            
            # 为当天选择餐厅
            restaurant_idx = (day - 1) % len(restaurants) if restaurants else 0
            day_restaurants = restaurants[restaurant_idx:restaurant_idx + restaurants_per_day] if restaurants else []
            
            day_plan = {
                "day": day,
                "title": f"{city} 第{day}天探索之旅",
                "description": f"探索{city}的精彩景点，品味当地美食",
                "attractions": day_attractions,
                "restaurants": day_restaurants,
                "estimated_cost": 100.0,  # 预估每日费用
                "travel_tips": f"建议早上8点开始行程，晚上7点结束"
            }
            itinerary.append(day_plan)
        
        # 计算价格
        base_price = suggested_days * 150  # 每天150美元基础价格
        hotel_cost = suggested_days * 100  # 每晚100美元住宿
        meal_cost = suggested_days * 50   # 每天50美元餐饮
        transport_cost = 100              # 交通费用
        service_fee = (base_price + hotel_cost + meal_cost + transport_cost) * 0.1
        
        total_price = base_price + hotel_cost + meal_cost + transport_cost + service_fee
        
        price_breakdown = {
            "base_price": base_price,
            "hotel_cost": hotel_cost,
            "meal_cost": meal_cost,
            "transport_cost": transport_cost,
            "service_fee": service_fee,
            "total_price": total_price,
            "currency": "USD"
        }
        
        # 创建套餐
        package = TravelPackage(
            name=f"{city} 精彩之旅 {suggested_days}日游",
            description=f"探索{city}的经典景点，体验当地文化，品尝美食，享受难忘的旅行体验。",
            short_description=f"{suggested_days}天{suggested_days-1}夜的{city}深度游，包含主要景点和特色餐厅。",
            city=city,
            country="Unknown",  # 可以后续通过其他API获取
            duration_days=suggested_days,
            max_participants=20,
            min_participants=1,
            difficulty_level="easy",
            category="cultural",
            price_breakdown=price_breakdown,
            itinerary=itinerary,
            photos=[],  # 可以通过 Foursquare 获取照片
            included_services=[
                "专业导游服务",
                "景点门票",
                "交通安排",
                "餐厅预订"
            ],
            excluded_services=[
                "酒店住宿",
                "个人消费",
                "保险费用",
                "小费"
            ],
            is_active=True,
            featured=False
        )
        
        session.add(package)
        await session.commit()
        await session.refresh(package)
        
        # 返回创建的套餐数据
        package_data = {
            "id": package.id,
            "name": package.name,
            "description": package.description,
            "city": package.city,
            "durationDays": package.duration_days,
            "priceBreakdown": package.price_breakdown,
            "itinerary": package.itinerary,
            "attractionsFound": len(attractions),
            "restaurantsFound": len(restaurants),
            "createdAt": package.created_at
        }
        
        return success(data=package_data, status=201)
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise e
        print(f"创建套餐失败: {e}")
        raise_error(500, f"创建套餐失败: {str(e)}")


async def create_manual_travel_package(data: Dict, session: AsyncSession):
    """手动创建旅游套餐"""
    try:
        package = TravelPackage(
            name=data.get("name"),
            description=data.get("description"),
            short_description=data.get("shortDescription"),
            city=data.get("city"),
            country=data.get("country", "Unknown"),
            coordinates=data.get("coordinates"),
            duration_days=data.get("durationDays"),
            max_participants=data.get("maxParticipants", 20),
            min_participants=data.get("minParticipants", 1),
            difficulty_level=data.get("difficultyLevel", "easy"),
            category=data.get("category", "cultural"),
            price_breakdown=data.get("priceBreakdown"),
            itinerary=data.get("itinerary", []),
            weather_info=data.get("weatherInfo"),
            photos=data.get("photos", []),
            included_services=data.get("includedServices", []),
            excluded_services=data.get("excludedServices", []),
            featured=data.get("featured", False)
        )
        
        session.add(package)
        await session.commit()
        await session.refresh(package)
        
        package_data = {
            "id": package.id,
            "name": package.name,
            "description": package.description,
            "city": package.city,
            "durationDays": package.duration_days,
            "priceBreakdown": package.price_breakdown,
            "createdAt": package.created_at
        }
        
        return success(data=package_data, status=201)
        
    except Exception as e:
        print(f"手动创建套餐失败: {e}")
        raise_error(500, f"手动创建套餐失败: {str(e)}")


async def update_travel_package(package_id: int, data: Dict, session: AsyncSession):
    """更新旅游套餐"""
    try:
        query = select(TravelPackage).where(TravelPackage.id == package_id)
        result = await session.execute(query)
        package = result.scalar_one_or_none()
        
        if not package:
            raise_error(404, "旅游套餐不存在")
        
        # 更新字段
        update_fields = {}
        if "name" in data:
            update_fields["name"] = data["name"]
        if "description" in data:
            update_fields["description"] = data["description"]
        if "shortDescription" in data:
            update_fields["short_description"] = data["shortDescription"]
        if "priceBreakdown" in data:
            update_fields["price_breakdown"] = data["priceBreakdown"]
        if "itinerary" in data:
            update_fields["itinerary"] = data["itinerary"]
        if "photos" in data:
            update_fields["photos"] = data["photos"]
        if "featured" in data:
            update_fields["featured"] = data["featured"]
        if "isActive" in data:
            update_fields["is_active"] = data["isActive"]
        
        if update_fields:
            update_fields["updated_at"] = datetime.now()
            
            update_stmt = update(TravelPackage).where(
                TravelPackage.id == package_id
            ).values(**update_fields)
            
            await session.execute(update_stmt)
            await session.commit()
        
        return success(message="套餐更新成功")
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise e
        print(f"更新套餐失败: {e}")
        raise_error(500, f"更新套餐失败: {str(e)}")


async def delete_travel_package(package_id: int, session: AsyncSession):
    """删除旅游套餐（软删除）"""
    try:
        update_stmt = update(TravelPackage).where(
            TravelPackage.id == package_id
        ).values(
            is_active=False,
            updated_at=datetime.now()
        )
        
        result = await session.execute(update_stmt)
        
        if result.rowcount == 0:
            raise_error(404, "旅游套餐不存在")
        
        await session.commit()
        
        return success(message="套餐删除成功")
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise e
        print(f"删除套餐失败: {e}")
        raise_error(500, f"删除套餐失败: {str(e)}")


async def create_package_booking(package_id: int, data: Dict, current_user: dict, session: AsyncSession):
    """创建套餐预订"""
    try:
        # 验证套餐存在
        package_query = select(TravelPackage).where(
            TravelPackage.id == package_id,
            TravelPackage.is_active == True
        )
        package_result = await session.execute(package_query)
        package = package_result.scalar_one_or_none()
        
        if not package:
            raise_error(404, "旅游套餐不存在")
        
        participants_count = data.get("participantsCount", 1)
        
        # 验证参与人数
        if participants_count < package.min_participants or participants_count > package.max_participants:
            raise_error(400, f"参与人数必须在 {package.min_participants} - {package.max_participants} 之间")
        
        # 计算总价格
        total_price = package.get_total_price(participants_count)
        
        # 生成预订号
        booking_number = generate_booking_number()
        
        # 创建预订
        booking = TravelPackageBooking(
            package_id=package_id,
            user_id=current_user["id"],
            booking_number=booking_number,
            participants_count=participants_count,
            travel_date=datetime.fromisoformat(data.get("travelDate")),
            participant_details=data.get("participantDetails", []),
            total_price=total_price,
            currency=package.price_breakdown.get("currency", "USD"),
            contact_email=data.get("contactEmail", current_user.get("email", "")),
            contact_phone=data.get("contactPhone"),
            special_requests=data.get("specialRequests")
        )
        
        session.add(booking)
        await session.commit()
        await session.refresh(booking)
        
        # 更新套餐预订统计
        update_stmt = update(TravelPackage).where(
            TravelPackage.id == package_id
        ).values(
            booking_count=TravelPackage.booking_count + 1
        )
        await session.execute(update_stmt)
        await session.commit()
        
        booking_data = {
            "id": booking.id,
            "bookingNumber": booking.booking_number,
            "packageName": package.name,
            "participantsCount": booking.participants_count,
            "travelDate": booking.travel_date,
            "totalPrice": booking.total_price,
            "currency": booking.currency,
            "status": booking.status,
            "createdAt": booking.created_at
        }
        
        return success(data=booking_data, status=201)
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise e
        print(f"创建预订失败: {e}")
        raise_error(500, f"创建预订失败: {str(e)}")


def generate_booking_number() -> str:
    """生成预订号"""
    timestamp = datetime.now().strftime("%Y%m%d")
    random_code = ''.join(secrets.choices(string.ascii_uppercase + string.digits, k=6))
    return f"TP{timestamp}{random_code}"


async def get_package_categories(session: AsyncSession):
    """获取套餐分类统计"""
    try:
        query = select(
            TravelPackage.category,
            func.count(TravelPackage.id).label("count")
        ).where(
            TravelPackage.is_active == True
        ).group_by(TravelPackage.category)
        
        result = await session.execute(query)
        categories = result.all()
        
        category_data = [
            {"category": cat[0], "count": cat[1]}
            for cat in categories
        ]
        
        return success(data=category_data)
        
    except Exception as e:
        print(f"获取分类统计失败: {e}")
        raise_error(500, f"获取分类统计失败: {str(e)}")


async def search_packages_by_foursquare(query: str, near: str, session: AsyncSession):
    """使用 Foursquare 搜索相关套餐"""
    try:
        # 使用 Foursquare 搜索景点
        places = await foursquare_service.search_places(
            query=query,
            near=near,
            limit=10
        )
        
        if not places:
            return success(data={"places": [], "suggestedPackages": []})
        
        # 根据搜索到的地点，查找相关的套餐
        cities = list(set([place.get("address", "").split(",")[-2].strip() for place in places if place.get("address")]))
        
        if cities:
            packages_query = select(TravelPackage).where(
                TravelPackage.city.in_(cities[:5]),  # 限制查询城市数量
                TravelPackage.is_active == True
            ).limit(10)
            
            packages_result = await session.execute(packages_query)
            packages = packages_result.scalars().all()
            
            packages_data = [
                {
                    "id": pkg.id,
                    "name": pkg.name,
                    "city": pkg.city,
                    "durationDays": pkg.duration_days,
                    "priceBreakdown": pkg.price_breakdown,
                    "photos": pkg.photos[:3]  # 只返回前3张图片
                }
                for pkg in packages
            ]
        else:
            packages_data = []
        
        return success(data={
            "places": places[:5],  # 返回前5个地点
            "suggestedPackages": packages_data
        })
        
    except Exception as e:
        print(f"搜索套餐失败: {e}")
        raise_error(500, f"搜索套餐失败: {str(e)}")