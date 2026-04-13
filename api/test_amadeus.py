# api/test_amadeus.py
import asyncio
from app.services.amadeus_service import AmadeusService

async def main():
    service = AmadeusService()

    # 測試 token 取得
    token = await service.get_token()
    print("Token:", token)

    # 測試航班搜尋
    result = await service.search_flights(origin="LAX", destination="JFK", date="2026-04-20")
    print(result)

if __name__ == "__main__":
    asyncio.run(main())