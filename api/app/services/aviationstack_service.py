import httpx
import airportsdata
from app.core.config import settings

BASE_URL = "http://api.aviationstack.com/v1"

class AviationstackService:

    async def search_flights(self, origin: str, destination: str, date: str = None) -> dict:
        """
        使用 Aviationstack 查航班（注意：沒有票價）

        參數:
            origin: IATA (e.g. TPE)
            destination: IATA (e.g. NRT)
            date: YYYY-MM-DD (optional)

        回傳: 航班資訊（非票價）
        """

        timeout = httpx.Timeout(30.0)

        params = {
            "access_key": settings.AVIATIONSTACK_KEY,
            "dep_iata": origin,
            "arr_iata": destination,
        }

        # Aviationstack 日期不是必須，但可以用 flight_date  免費版會 403
        # if date:
        #     params["flight_date"] = date

        async with httpx.AsyncClient(timeout=timeout) as client:
            res = await client.get(
                f"{BASE_URL}/flights",
                params=params
            )

        print("STATUS:", res.status_code)
        print("BODY:", res.text[:300])    

        res.raise_for_status()
        data = res.json()

        result = []

        for f in data.get("data", []):
            flight = {
                "航班日期": f.get("flight_date"),
                "航班狀態": f.get("flight_status"),
                "航班號": f.get("flight", {}).get("iata"),
                
                "出發": {
                    "機場": f.get("departure", {}).get("airport"),
                    "IATA": f.get("departure", {}).get("iata"),
                    "時間": f.get("departure", {}).get("scheduled")
                },

                "抵達": {
                    "機場": f.get("arrival", {}).get("airport"),
                    "IATA": f.get("arrival", {}).get("iata"),
                    "時間": f.get("arrival", {}).get("scheduled")
                },

                "航空公司": f.get("airline", {}).get("name"),

                "備註": "Aviationstack 不提供票價"
            }

            result.append(flight)

        return {
            "flights": result,
            "count": len(result)
        }
       



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