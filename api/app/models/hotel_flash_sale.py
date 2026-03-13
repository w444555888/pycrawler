from datetime import datetime, timezone
from typing import Optional
from pydantic import ConfigDict, Field
from beanie import Document, Link
from .hotel import Hotel
from .room import Room
from .user import User


class HotelFlashSale(Document):
    """飯店限時搶購活動"""
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(..., description="活動名稱")
    hotel_id: Link[Hotel] = Field(..., alias="hotelId", description="酒店ID")
    room_id: Link[Room] = Field(..., alias="roomId", description="房间ID") 
    base_price: float = Field(..., alias="basePrice", description="活動期間的基礎售價")
    discount_rate: float = Field(default=1.0, alias="discountRate", description="折扣率")
    start_time: datetime = Field(..., alias="startTime", description="开始时间")
    end_time: datetime = Field(..., alias="endTime", description="结束时间")
    quantity_limit: int = Field(default=0, alias="quantityLimit", description="活動限量總數")
    sold_count: int = Field(default=0, alias="soldCount", description="已售數")
    banner_url: Optional[str] = Field(default="", alias="bannerUrl", description="Banner圖片URL")
    description: Optional[str] = Field(default="", description="活動說明")
    is_active: bool = Field(default=True, alias="isActive", description="是否啟用")

    created_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc), alias="createdAt")
    updated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc), alias="updatedAt")

    class Settings:
        name = "hotelflashsales"


class HotelFlashSaleInventory(Document):
    """飯店限時搶購庫存"""
    model_config = ConfigDict(populate_by_name=True)

    sale_id: Link[HotelFlashSale] = Field(..., alias="saleId", description="活动ID")
    date: str = Field(..., description="日期 yyyy-MM-dd格式")
    total_rooms: int = Field(..., alias="totalRooms", description="总房间数")
    booked_rooms: int = Field(default=0, alias="bookedRooms", description="已预订房间数")

    created_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc), alias="createdAt")
    updated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc), alias="updatedAt")

    class Settings:
        name = "hotelflashsaleinventories"
        indexes = [
            [("sale_id", 1), ("date", 1)],  # 确保唯一性
        ]


class HotelFlashSaleOrder(Document):
    """飯店限時搶購訂單"""
    model_config = ConfigDict(populate_by_name=True)

    sale_id: Link[HotelFlashSale] = Field(..., alias="saleId", description="活动ID")
    user_id: Link[User] = Field(..., alias="userId", description="用户ID")
    hotel_id: Link[Hotel] = Field(..., alias="hotelId", description="酒店ID")
    room_id: Link[Room] = Field(..., alias="roomId", description="房间ID")
    date: str = Field(..., description="預訂日期（對應庫存日期）")
    discount_rate: float = Field(default=0, alias="discountRate", description="折扣率")
    base_price: Optional[float] = Field(None, alias="basePrice", description="原價")
    final_price: Optional[float] = Field(None, alias="finalPrice", description="折扣後價格")
    status: str = Field(default="booked", description="訂單狀態", pattern="^(booked|cancelled)$")

    created_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc), alias="createdAt")
    updated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc), alias="updatedAt")

    class Settings:
        name = "hotelflashsaleorders"