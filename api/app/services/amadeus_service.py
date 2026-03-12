import httpx
from app.core.config import settings

BASE_URL = "https://test.api.amadeus.com"

class AmadeusService:

    async def get_token(self) -> str:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"{BASE_URL}/v1/security/oauth2/token",
                data={
                    "grant_type": "client_credentials",
                    "client_id": settings.AMADEUS_KEY,
                    "client_secret": settings.AMADEUS_SECRET
                }
            )
        res.raise_for_status()
        return res.json()["access_token"]

    async def search_flights(self, origin: str, destination: str, date: str, return_date: str = None) -> dict:
        """
        搜尋航班
        
        參數:
            origin: 出發地 IATA 代碼
            destination: 目的地 IATA 代碼
            date: 出發日期 (YYYY-MM-DD)
            return_date: 回程日期 (YYYY-MM-DD，可選)
        
        返回: 航班搜尋結果
        """
        token = await self.get_token()
        timeout = httpx.Timeout(30.0)
        
        # 構建請求參數
        params = {
            "originLocationCode": origin,
            "destinationLocationCode": destination,
            "departureDate": date,
            "adults": 1
        }
        
        # 如果提供了回程日期，添加到參數中
        if return_date:
            params["returnDate"] = return_date
        
        async with httpx.AsyncClient(timeout=timeout) as client:
            res = await client.get(
                f"{BASE_URL}/v2/shopping/flight-offers",
                headers={"Authorization": f"Bearer {token}"},
                params=params
            )
        res.raise_for_status()
        data = res.json()

        # 整理 JSON
        result = []
        for offer in data.get("data", []):
            flight = {
                "航班ID (flight id)": offer.get("id"),
                "航班來源 (source)": offer.get("source"),
                "是否需要即時出票 (instantTicketingRequired)": offer.get("instantTicketingRequired"),
                "可訂座位數 (numberOfBookableSeats)": offer.get("numberOfBookableSeats"),
                "行程 (itineraries)": [],
                "價格資訊 (price)": offer.get("price")
            }

            for itin in offer.get("itineraries", []):
                itinerary = {
                    "行程總時間 (duration)": itin.get("duration"),
                    "航段 (segments)": []
                }
                for seg in itin.get("segments", []):
                    segment = {
                        "出發地 (departure)": seg.get("departure"),
                        "目的地 (arrival)": seg.get("arrival"),
                        "航空公司代碼 (carrierCode)": seg.get("carrierCode"),
                        "航班號碼 (number)": seg.get("number"),
                        "飛機型號 (aircraft)": seg.get("aircraft"),
                        "航段時間 (duration)": seg.get("duration")
                    }
                    itinerary["航段 (segments)"].append(segment)
                flight["行程 (itineraries)"].append(itinerary)

            result.append(flight)

        return {"航班搜尋結果 (flights)": result}

    async def search_locations(self, keyword: str, page: int = 1, limit: int = 10) -> dict:
        """
        搜尋機場和城市
        使用 Amadeus 城市搜尋 API
        
        參數:
            keyword: 搜尋關鍵詞 (機場代碼、城市名稱等)
            page: 頁碼 (預設 1)
            limit: 每頁結果數 (預設 10)
        
        返回:
            {
                "meta": {
                    "count": 28,
                    "page": 1,
                    "limit": 10,
                    "links": {
                        "self": "...",
                        "next": "...",
                        "last": "..."
                    }
                },
                "location_results": [
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
            token = await self.get_token()
            offset = (page - 1) * limit
            
            async with httpx.AsyncClient() as client:
                res = await client.get(
                    f"{BASE_URL}/v1/reference-data/locations",
                    headers={"Authorization": f"Bearer {token}"},
                    params={
                        "keyword": keyword,
                        "subType": "AIRPORT,CITY",
                        "page[limit]": limit,
                        "page[offset]": offset
                    }
                )
            res.raise_for_status()
            data = res.json()
            
            # 整理搜尋結果
            locations = []
            for item in data.get("data", []):
                location = {
                    "iataCode": item.get("iataCode"),
                    "name": item.get("name"),
                    "type": item.get("type"),  # AIRPORT, CITY
                    "country": item.get("address", {}).get("countryCode"),
                    "countryName": item.get("address", {}).get("countryName")
                }
                locations.append(location)
            
            # 提取分頁元數據
            meta_data = data.get("meta", {})
            total_count = meta_data.get("count", len(locations))
            links = meta_data.get("links", {})
            
            # 計算總頁數
            total_pages = (total_count + limit - 1) // limit
            
            # 構建返回的 meta 信息
            result_meta = {
                "count": total_count,
                "page": page,
                "limit": limit,
                "totalPages": total_pages,
                "links": {
                    "self": links.get("self", ""),
                    "next": links.get("next") if page < total_pages else None,
                    "last": links.get("last", "")
                }
            }
            
            return {
                "meta": result_meta,
                "location_results": locations
            }
        except Exception as e:
            return {
                "meta": {
                    "count": 0,
                    "page": page,
                    "limit": limit,
                    "totalPages": 0,
                    "links": {
                        "self": None,
                        "next": None,
                        "last": None
                    }
                },
                "location_results": [],
                "error": str(e)
            }