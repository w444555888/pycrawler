import httpx
from typing import Optional

async def geocode_city(city: str, country: Optional[str] = None) -> Optional[str]:
    """
    使用 OpenCage Geocoding API 
    """
    from app.core.config import settings
    api_key = settings.OPENCAGE_API_KEY
    base_url = "https://api.opencagedata.com/geocode/v1/json"
    q = city if not (country and country.strip()) else f"{city}, {country}"
    params = {"q": q, "key": api_key, "limit": 1, "language": "zh"}
    async with httpx.AsyncClient() as client:
        resp = await client.get(base_url, params=params)
        resp.raise_for_status()
        data = resp.json()

        print("OpenCage返回：", data)  

        if data.get("results"):
            lat = data["results"][0]["geometry"]["lat"]
            lng = data["results"][0]["geometry"]["lng"]
            return f"{lat},{lng}"
        return None