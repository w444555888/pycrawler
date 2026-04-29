import logging
from app.utils.geocode import geocode_city
import httpx
import asyncio
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from fastapi import HTTPException
from app.core.config import settings
from app.utils.response import success
from app.utils.error_handler import raise_error


class FoursquareAPIService:
    """Foursquare API 服务类"""
    
    def __init__(self):
        self.base_url = "https://places-api.foursquare.com"
        self.api_key = settings.FOURSQUARE_API_KEY
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
            "X-Places-Api-Version": "2025-06-17"
        }
            
            
    async def _make_request(self, endpoint: str, params: Dict = None) -> Dict:
        """发起 HTTP 请求的通用方法（新版 Places API）"""
        url = f"{self.base_url}/{endpoint}"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=self.headers, params=params or {})
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            print(f"Foursquare API 请求失败: {e}")
            raise_error(500, f"Foursquare API 请求失败: {str(e)}")
        except Exception as e:
            print(f"请求处理异常: {e}")
            raise_error(500, f"请求处理异常: {str(e)}")
    
    # 二次封装更具体的 API 方法，适合在服务层调用

    async def search_places(self, 
                           query: str = None, 
                           ll: str = None,
                           categories: str = None,
                           limit: int = 20,
                           radius: int = 10000) -> List[Dict]:
        """搜索地点 (新版 Places API 仅支持 ll)
        Args:
            query: 搜索关键词
            ll: 经纬度，格式 "35.6895,139.6917"
            categories: 分类ID，多个用逗号分隔
                        查餐厅：categories="13000"
                        查酒店：categories="19014"
                        查景点：categories="10000,16000"
                        查商场：categories="19009"
                        查所有类型：不传 categories
            limit: 返回结果数量 (最大50)
            radius: 搜索半径 (米，最大100000)

            
        """
        params = {
            "limit": min(limit, 50),
            "radius": min(radius, 100000)
        }
        if query:
            params["query"] = query
        if ll:
            params["ll"] = ll
        if categories:
            params["categories"] = categories
        data = await self._make_request("places/search", params)
        logging.info(f"[Foursquare][search_places] 原始返回: {data}")
        results = data.get("results") or data.get("data") or []
        return self._process_places(results)
    
    async def get_place_details(self, fsq_place_id: str) -> Dict:
        """获取地点详细信息（新版）"""
        data = await self._make_request(f"places/{fsq_place_id}")
        logging.info(f"[Foursquare][get_place_details] 原始返回: {data}")
        return self._process_single_place(data)
    
    async def get_place_photos(self, fsq_place_id: str, limit: int = 10) -> List[str]:
        """获取地点照片（新版）"""
        params = {"limit": min(limit, 50)}
        data = await self._make_request(f"places/{fsq_place_id}/photos", params)
        print(f"[Foursquare][get_place_photos] 原始返回: {data}")
        logging.info(f"[Foursquare][get_place_photos] 原始返回: {data}")
        
        photos = []
        for photo in data.get("results", []) or data.get("data", []):
            photo_url = photo.get("prefix", "") + "original" + photo.get("suffix", "")
            photos.append(photo_url)
        return photos
    
    async def get_place_hours(self, fsq_id: str) -> Dict:
        """获取地点营业时间"""
        try:
            data = await self._make_request(f"places/{fsq_id}/hours")
            logging.info(f"[Foursquare][get_place_hours] 原始返回: {data}")
            return self._process_hours(data.get("hours", {}))
        except Exception as e:
            logging.error(f"[Foursquare][get_place_hours] 异常: {e}")
            return {}
    
    def _process_places(self, places: List[Dict]) -> List[Dict]:
        """处理地点搜索结果（新版字段，保留更多原始字段）"""
        processed = []
        for place in places:
            processed_place = {
                "fsq_place_id": place.get("fsq_place_id"),
                "name": place.get("name"),
                "categories": place.get("categories", []),  # 保留完整分类数组
                "primary_category": self._get_primary_category(place.get("categories", [])),
                "location": place.get("location", {}),  # 保留原始location对象
                "address": self._format_address(place.get("location", {})),
                "distance": place.get("distance"),
                "rating": place.get("rating"),
                "price_level": place.get("price"),
                "coordinates": {
                    "lat": place.get("latitude"),
                    "lng": place.get("longitude")
                },
                "photos": place.get("photos", []),
                "attributes": place.get("attributes", {}),
                "description": place.get("description"),
                "link": place.get("link"),
                "placemaker_url": place.get("placemaker_url"),
                "tel": place.get("tel"),
                "website": place.get("website"),
                "date_created": place.get("date_created"),
                "date_refreshed": place.get("date_refreshed"),
                "related_places": place.get("related_places", {}),
                "social_media": place.get("social_media", {}),
                "stats": place.get("stats", {}),
                "chains": place.get("chains", []),
                "extended_location": place.get("extended_location", {}),
            }
            processed.append(processed_place)
        return processed
    
    def _process_single_place(self, place: Dict) -> Dict:
        """处理单个地点详细信息（新版字段，保留更多原始字段）"""
        return {
            "fsq_place_id": place.get("fsq_place_id"),
            "name": place.get("name"),
            "categories": place.get("categories", []),
            "primary_category": self._get_primary_category(place.get("categories", [])),
            "location": place.get("location", {}),
            "address": self._format_address(place.get("location", {})),
            "rating": place.get("rating"),
            "price_level": place.get("price"),
            "coordinates": {
                "lat": place.get("latitude"),
                "lng": place.get("longitude")
            },
            "description": place.get("description"),
            "website": place.get("website"),
            "phone": place.get("tel"),
            "email": place.get("email"),
            "attributes": place.get("attributes", {}),
            "stats": place.get("stats", {}),
            "link": place.get("link"),
            "placemaker_url": place.get("placemaker_url"),
            "date_created": place.get("date_created"),
            "date_refreshed": place.get("date_refreshed"),
            "related_places": place.get("related_places", {}),
            "social_media": place.get("social_media", {}),
            "chains": place.get("chains", []),
            "extended_location": place.get("extended_location", {}),
        }
    
    def _get_primary_category(self, categories: List[Dict]) -> str:
        """获取主要分类名称"""
        if categories:
            return categories[0].get("name", "Unknown")
        return "Unknown"
    
    def _format_address(self, location: Dict) -> str:
        """格式化地址"""
        address_parts = []
        
        if location.get("address"):
            address_parts.append(location["address"])
        if location.get("locality"):
            address_parts.append(location["locality"])
        if location.get("region"):
            address_parts.append(location["region"])
        if location.get("country"):
            address_parts.append(location["country"])
        
        return ", ".join(address_parts) if address_parts else "Unknown"
    
    def _process_hours(self, hours_data: Dict) -> Dict:
        """处理营业时间数据"""
        if not hours_data:
            return {}
        
        processed_hours = {}
        
        # 处理常规营业时间
        regular_hours = hours_data.get("regular", [])
        for day_info in regular_hours:
            day = day_info.get("day", 0)  # 0=Sunday, 1=Monday, etc.
            day_name = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day]
            
            if day_info.get("open"):
                start_time = day_info["open"][0].get("start", "")
                end_time = day_info["open"][0].get("end", "")
                processed_hours[day_name] = f"{start_time}-{end_time}"
            else:
                processed_hours[day_name] = "Closed"
        
        return processed_hours
    

    # 三次封裝使用更方便的高階方法，適合直接在路由中調用

    # 景点相关的搜索方法
    async def search_attractions(self, 
                               ll: str, 
                               limit: int = 20,
                               radius: int = 15000) -> List[Dict]:
        """搜索景点 (v3 仅支持 ll)"""
        attraction_categories = "10000,16000"  # Arts & Entertainment, Landmarks & Outdoors
        return await self.search_places(
            ll=ll,
            categories=attraction_categories,
            limit=limit,
            radius=radius
        )


    async def get_enhanced_place_info(self, fsq_id: str) -> Dict:
        """获取增强的地点信息（包含照片和营业时间）"""
        # 并行请求基本信息、照片和营业时间
        tasks = [
            self.get_place_details(fsq_id),
            self.get_place_photos(fsq_id),
            self.get_place_hours(fsq_id)
        ]
        try:
            place_info, photos, hours = await asyncio.gather(*tasks, return_exceptions=True)

            # 处理异常结果
            if isinstance(place_info, Exception):
                place_info = {}
            if isinstance(photos, Exception):
                photos = []
            if isinstance(hours, Exception):
                hours = {}

            # 合并结果
            enhanced_info = place_info.copy()
            enhanced_info["photos"] = photos
            enhanced_info["opening_hours"] = hours

            return enhanced_info
        except Exception as e:
            print(f"获取增强信息失败: {e}")
            return {}
    

    async def create_city_travel_data(self, city: str) -> Dict:
        """為特定城市建立旅遊資料（保留 raw + 補強 enhanced）"""
        try:
            ll = await geocode_city(city)
            if not ll:
                raise_error(400, f"無法取得城市 {city} 的經緯度")

            lat, lng = map(float, ll.split(",")) if ll else (None, None)

            # 搜索景点（获取基础数据）
            attractions = await self.search_attractions(ll=ll, limit=15)

            # 补强每个景点信息
            async def enrich(place):
                fsq_id = place.get("fsq_place_id")
                if not fsq_id:
                    return place

                enhanced = await self.get_enhanced_place_info(fsq_id)

                if not enhanced:
                    return place

                return {
                    **place,
                    "photos": enhanced.get("photos", place.get("photos", [])),
                    "opening_hours": enhanced.get("opening_hours", {}),
                    "rating": enhanced.get("rating", place.get("rating")),
                    "website": enhanced.get("website", place.get("website")),
                    "phone": enhanced.get("phone", place.get("tel")),
                    "description": enhanced.get("description", place.get("description")),
                }

            # 并行处理补强请求，提升效率
            results = await asyncio.gather(
                *[enrich(p) for p in attractions],
                return_exceptions=True
            )

            # 过滤掉补强过程中可能出现的异常结果
            attractions = [
                r for r in results
                if isinstance(r, dict)
            ]

            return {
                "city": city,
                "ll": ll,
                "latitude": lat,
                "longitude": lng,
                "geo": {"lat": lat, "lng": lng},
                "attractions": attractions,
                "generated_at": datetime.now().isoformat(),
                "total_places": len(attractions)
            }

        except Exception as e:
            print(f"創建城市旅遊資料失敗: {e}")
            raise_error(500, f"創建城市旅遊資料失敗: {str(e)}")


foursquare_service = FoursquareAPIService()