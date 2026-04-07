# app/db.py
# create_async_engine => 建立 DB 連線 
# AsyncSession => DB 操作的 session 
# async_sessionmaker => session 工廠
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
# 建立 ORM 的 Base 類
from sqlalchemy.orm import DeclarativeBase
# 管理所有資料表的結構資訊
from sqlalchemy import MetaData
from app.core.config import settings


class Base(DeclarativeBase):
    """SQLAlchemy 声明基类"""
    metadata = MetaData()


# 创建异步数据库引擎
engine = create_async_engine(
    settings.database_url,
    echo=True,  # 开发模式下打印 SQL 语句
    pool_pre_ping=True,  # 连接池健康检查
    pool_recycle=3600,  # 连接回收时间
    pool_size=20,  # 连接池大小
    max_overflow=0  # 最大溢出连接数
)

# 创建异步会话工厂
AsyncSessionLocal = async_sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)


async def get_session() -> AsyncSession:
    """获取数据库会话的依赖注入函数"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """初始化数据库，创建所有表"""
    async with engine.begin() as conn:
        # 导入所有模型以确保它们被注册到 metadata
        from app.models.user import User
        from app.models.hotel import Hotel  
        from app.models.room import Room
        from app.models.order import Order
        from app.models.real_flight_orders import RealFlightOrders
        from app.models.room_inventory import RoomInventory
        from app.models.subscribe import Subscribe
        from app.models.hotel_flash_sale import HotelFlashSale, HotelFlashSaleInventory, HotelFlashSaleOrder
        
        # 创建所有表
        await conn.run_sync(Base.metadata.create_all)
        print(f"Connected to MySQL: {settings.DB_NAME}")
        print("All tables created successfully")
