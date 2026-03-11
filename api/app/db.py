# app/db.py
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.user import User
from app.models.hotel import Hotel
from app.models.room import Room
from app.models.order import Order
from app.models.flight_order import FlightOrder
from app.models.room_inventory import RoomInventory


async def init_db():
    client = AsyncIOMotorClient(settings.MONGODB)
    db = client.get_default_database()
    print("Connected to MongoDB:", db.name)

    # 初始化 Beanie ODM，註冊所有模型
    await init_beanie(
        database=db,
        document_models=[User, Hotel, Room, Order, FlightOrder, RoomInventory]
    )
