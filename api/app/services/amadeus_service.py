import httpx
import airportsdata
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
                },
                headers={
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            )

        print("STATUS:", res.status_code)
        print("BODY:", res.text)    

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
        搜尋機場和城市 - 使用本地 airportsdata 套件
        
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
                        "next": True/False
                    }
                },
                "location_results": [
                    {
                        "iataCode": "LAX",
                        "name": "Los Angeles International Airport", 
                        "type": "AIRPORT",
                        "country": "US",
                        "city": "Los Angeles"
                    }
                ]
            }
        """
        try:
            # 載入全球機場資料
            airports_data = airportsdata.load('IATA')
            
            keyword_lower = keyword.lower()
            keyword_upper = keyword.upper()
            results = []
            
            # 搜尋機場資料
            for iata, airport_info in airports_data.items():
                # 檢查 IATA 代碼匹配 (精確和模糊)
                if keyword_upper in iata:
                    results.append({
                        "iataCode": iata,
                        "name": airport_info.get('name', ''),
                        "city": airport_info.get('city', ''), 
                        "type": "AIRPORT",
                        "country": airport_info.get('country', '')
                    })
                    continue
                    
                # 檢查機場名稱匹配
                airport_name = airport_info.get('name', '').lower()
                if keyword_lower in airport_name:
                    results.append({
                        "iataCode": iata,
                        "name": airport_info.get('name', ''),
                        "city": airport_info.get('city', ''),
                        "type": "AIRPORT", 
                        "country": airport_info.get('country', '')
                    })
                    continue
                    
                # 檢查城市名稱匹配
                city_name = airport_info.get('city', '').lower()
                if keyword_lower in city_name:
                    results.append({
                        "iataCode": iata,
                        "name": airport_info.get('name', ''),
                        "city": airport_info.get('city', ''),
                        "type": "AIRPORT",
                        "country": airport_info.get('country', '')
                    })
            
            # 按相關性排序 (IATA 精確匹配優先)
            def sort_key(item):
                if item["iataCode"] == keyword_upper:
                    return 0  # 精確 IATA 匹配優先
                elif keyword_upper in item["iataCode"]:
                    return 1  # IATA 部分匹配
                elif keyword_lower in item["name"].lower():
                    return 2  # 機場名稱匹配
                else:
                    return 3  # 城市名稱匹配
            
            results.sort(key=sort_key)
            
            # 限制結果數量
            results = results[:100]  # 最多100個結果
            
            # 計算分頁
            total_count = len(results)
            total_pages = (total_count + limit - 1) // limit
            
            # 獲取當前頁的數據
            start_idx = (page - 1) * limit
            end_idx = start_idx + limit
            paginated_results = results[start_idx:end_idx]
            
            # 構建返回的 meta 信息
            result_meta = {
                "count": total_count,
                "page": page,
                "limit": limit,
                "totalPages": total_pages,
                "links": {
                    "next": page < total_pages
                }
            }
            
            return {
                "meta": result_meta,
                "location_results": paginated_results
            }
            
        except Exception as e:
            return {
                "meta": {
                    "count": 0,
                    "page": page,
                    "limit": limit,
                    "totalPages": 0,
                    "links": {
                        "next": False
                    }
                },
                "location_results": [],
                "error": str(e)
            }