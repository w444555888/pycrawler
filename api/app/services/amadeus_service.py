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

    async def search_flights(self, origin: str, destination: str, date: str) -> dict:
        token = await self.get_token()
        async with httpx.AsyncClient() as client:
            res = await client.get(
                f"{BASE_URL}/v2/shopping/flight-offers",
                headers={"Authorization": f"Bearer {token}"},
                params={
                    "originLocationCode": origin,
                    "destinationLocationCode": destination,
                    "departureDate": date,
                    "adults": 1
                }
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