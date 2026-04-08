from datetime import datetime, timezone
from typing import Optional, List, Literal, TYPE_CHECKING
from sqlalchemy import String, Float, DateTime, ForeignKey, Integer, Boolean, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, Field
from app.db import Base

if TYPE_CHECKING:
    from app.models.hotel import Hotel
    from app.models.room import Room
    from app.models.user import User


class HotelFlashSale(Base):
    """飯店限時搶購活動模型"""
    __tablename__ = "hotel_flash_sales"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    hotel_id: Mapped[int] = mapped_column(ForeignKey("hotels.id"), nullable=False, index=True)
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id"), nullable=False, index=True)
    base_price: Mapped[float] = mapped_column(Float, nullable=False)
    discount_rate: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    quantity_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sold_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    banner_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.now(), 
        onupdate=lambda: datetime.now(),
        nullable=False
    )

    # 关系映射
    hotel: Mapped["Hotel"] = relationship("Hotel")
    room: Mapped["Room"] = relationship("Room")
    inventories: Mapped[List["HotelFlashSaleInventory"]] = relationship("HotelFlashSaleInventory", back_populates="sale")
    orders: Mapped[List["HotelFlashSaleOrder"]] = relationship("HotelFlashSaleOrder", back_populates="sale")

    def update_timestamp(self):
        """手动更新时间戳"""
        self.updated_at = datetime.now()


class HotelFlashSaleInventory(Base):
    """飯店限時搶購庫存模型"""
    __tablename__ = "hotel_flash_sale_inventories"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    sale_id: Mapped[int] = mapped_column(ForeignKey("hotel_flash_sales.id"), nullable=False, index=True)
    date: Mapped[str] = mapped_column(String(10), nullable=False)  # yyyy-MM-dd格式
    total_rooms: Mapped[int] = mapped_column(Integer, nullable=False)
    booked_rooms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.now(), 
        onupdate=lambda: datetime.now(),
        nullable=False
    )

    # 关系映射
    sale: Mapped["HotelFlashSale"] = relationship("HotelFlashSale", back_populates="inventories")

    # 创建唯一索引
    __table_args__ = (
        Index('ix_sale_date', 'sale_id', 'date', unique=True),
    )

    def update_timestamp(self):
        """手动更新时间戳"""
        self.updated_at = datetime.now()


class HotelFlashSaleOrder(Base):
    """飯店限时搶購訂單模型"""
    __tablename__ = "hotel_flash_sale_orders"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    sale_id: Mapped[int] = mapped_column(ForeignKey("hotel_flash_sales.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    hotel_id: Mapped[int] = mapped_column(ForeignKey("hotels.id"), nullable=False, index=True)
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id"), nullable=False, index=True)
    date: Mapped[str] = mapped_column(String(10), nullable=False)  # 预订日期
    discount_rate: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    base_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    final_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="booked", nullable=False)  # booked|cancelled
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.now(), 
        onupdate=lambda: datetime.now(),
        nullable=False
    )

    # 关系映射
    sale: Mapped["HotelFlashSale"] = relationship("HotelFlashSale", back_populates="orders")
    user: Mapped["User"] = relationship("User")
    hotel: Mapped["Hotel"] = relationship("Hotel")
    room: Mapped["Room"] = relationship("Room")

    def update_timestamp(self):
        """手动更新时间戳"""
        self.updated_at = datetime.now()


# Pydantic 模型用于 API
class HotelFlashSaleCreate(BaseModel):
    title: str = Field(...)
    hotel_id: int = Field(..., alias="hotelId")
    room_id: int = Field(..., alias="roomId")
    base_price: float = Field(..., alias="basePrice")
    discount_rate: float = Field(default=1.0, alias="discountRate")
    start_time: datetime = Field(..., alias="startTime")
    end_time: datetime = Field(..., alias="endTime")
    quantity_limit: int = Field(default=0, alias="quantityLimit")
    sold_count: int = Field(default=0, alias="soldCount")
    banner_url: Optional[str] = Field(default="", alias="bannerUrl")
    description: Optional[str] = Field(default="")
    is_active: bool = Field(default=True, alias="isActive")


class HotelFlashSaleResponse(BaseModel):
    id: int
    title: str = Field(...)
    hotel_id: int = Field(..., alias="hotelId")
    room_id: int = Field(..., alias="roomId")
    base_price: float = Field(..., alias="basePrice")
    discount_rate: float = Field(..., alias="discountRate")
    start_time: datetime = Field(..., alias="startTime")
    end_time: datetime = Field(..., alias="endTime")
    quantity_limit: int = Field(..., alias="quantityLimit")
    sold_count: int = Field(..., alias="soldCount")
    banner_url: Optional[str] = Field(default="", alias="bannerUrl")
    description: Optional[str] = Field(default="")
    is_active: bool = Field(..., alias="isActive")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class HotelFlashSaleInventoryCreate(BaseModel):
    sale_id: int = Field(..., alias="saleId")
    date: str = Field(...)
    total_rooms: int = Field(..., alias="totalRooms")
    booked_rooms: int = Field(default=0, alias="bookedRooms")


class HotelFlashSaleInventoryResponse(BaseModel):
    id: int
    sale_id: int = Field(..., alias="saleId")
    date: str = Field(...)
    total_rooms: int = Field(..., alias="totalRooms")
    booked_rooms: int = Field(..., alias="bookedRooms")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class HotelFlashSaleOrderCreate(BaseModel):
    sale_id: int = Field(..., alias="saleId")
    user_id: int = Field(..., alias="userId")
    hotel_id: int = Field(..., alias="hotelId")
    room_id: int = Field(..., alias="roomId")
    date: str = Field(...)
    discount_rate: float = Field(default=0, alias="discountRate")
    base_price: Optional[float] = Field(None, alias="basePrice")
    final_price: Optional[float] = Field(None, alias="finalPrice")
    status: Literal["booked", "cancelled"] = Field(default="booked")


class HotelFlashSaleOrderResponse(BaseModel):
    id: int
    sale_id: int = Field(..., alias="saleId")
    user_id: int = Field(..., alias="userId")
    hotel_id: int = Field(..., alias="hotelId")
    room_id: int = Field(..., alias="roomId")
    date: str = Field(...)
    discount_rate: float = Field(..., alias="discountRate")
    base_price: Optional[float] = Field(None, alias="basePrice")
    final_price: Optional[float] = Field(None, alias="finalPrice")
    status: str = Field(...)
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    
    class Config:
        from_attributes = True
        populate_by_name = True