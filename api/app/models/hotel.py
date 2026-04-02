from typing import Optional, List, Literal, TYPE_CHECKING
from sqlalchemy import String, Float, Boolean, Integer, Text, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timezone
from app.db import Base

if TYPE_CHECKING:
    from app.models.room import Room
    from app.models.order import Order


class Coordinates(BaseModel):
    """坐标信息"""
    latitude: float = Field(..., alias="latitude")
    longitude: float = Field(..., alias="longitude")


class Facilities(BaseModel):
    """设施信息"""
    wifi: bool = Field(default=False, alias="wifi")
    parking: bool = Field(default=False, alias="parking")
    pool: bool = Field(default=False, alias="pool")
    gym: bool = Field(default=False, alias="gym")
    spa: bool = Field(default=False, alias="spa")
    restaurant: bool = Field(default=False, alias="restaurant")
    bar: bool = Field(default=False, alias="bar")


class Hotel(Base):
    """酒店模型"""
    __tablename__ = "hotels"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # hotel, apartment, guesthouse, etc.
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    distance: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    photos: Mapped[List[str]] = mapped_column(JSON, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    desc: Mapped[str] = mapped_column(Text, nullable=False)
    rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    cheapest_price: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    popular_hotel: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    comments: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    facilities: Mapped[dict] = mapped_column(JSON, nullable=False)  # 存储 Facilities 对象
    check_in_time: Mapped[str] = mapped_column(String(10), nullable=False)
    check_out_time: Mapped[str] = mapped_column(String(10), nullable=False)
    coordinates: Mapped[dict] = mapped_column(JSON, nullable=False)  # 存储 Coordinates 对象
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    nearby_attractions: Mapped[List[str]] = mapped_column(JSON, nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.now(timezone.utc), 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # 关系映射
    rooms: Mapped[List["Room"]] = relationship("Room", back_populates="hotel")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="hotel")

    def update_timestamp(self):
        """手动更新时间戳"""
        self.updated_at = datetime.now(timezone.utc)


# Pydantic 模型用于 API
class HotelCreate(BaseModel):
    name: str = Field(..., alias="name")
    type: Literal['hotel', 'apartment', 'guesthouse', 'villa', 'hostel', 'motel', 'capsule', 'resort'] = Field(..., alias="type")
    city: str = Field(..., alias="city")
    address: str = Field(..., alias="address")
    distance: Optional[str] = Field(default=None, alias="distance")
    photos: List[str] = Field(..., alias="photos")
    title: str = Field(..., alias="title")
    desc: str = Field(..., alias="desc")
    rating: Optional[float] = Field(default=None, ge=0, le=10, alias="rating")
    cheapest_price: float = Field(..., alias="cheapestPrice")
    popular_hotel: bool = Field(default=False, alias="popularHotel")
    comments: int = Field(default=0, alias="comments")
    facilities: Facilities = Field(default_factory=Facilities, alias="facilities")
    check_in_time: str = Field(..., alias="checkInTime")
    check_out_time: str = Field(..., alias="checkOutTime")
    coordinates: Coordinates = Field(..., alias="coordinates")
    email: str = Field(..., alias="email")
    nearby_attractions: List[str] = Field(..., alias="nearbyAttractions")
    phone: str = Field(..., alias="phone")


class HotelResponse(BaseModel):
    id: int
    name: str = Field(..., alias="name")
    type: str = Field(..., alias="type")
    city: str = Field(..., alias="city")
    address: str = Field(..., alias="address")
    distance: Optional[str] = Field(default=None, alias="distance")
    photos: List[str] = Field(..., alias="photos")
    title: str = Field(..., alias="title")
    desc: str = Field(..., alias="desc")
    rating: Optional[float] = Field(default=None, alias="rating")
    cheapest_price: float = Field(..., alias="cheapestPrice")
    popular_hotel: bool = Field(..., alias="popularHotel")
    comments: int = Field(..., alias="comments")
    facilities: dict = Field(..., alias="facilities")
    check_in_time: str = Field(..., alias="checkInTime")
    check_out_time: str = Field(..., alias="checkOutTime")
    coordinates: dict = Field(..., alias="coordinates")
    email: str = Field(..., alias="email")
    nearby_attractions: List[str] = Field(..., alias="nearbyAttractions")
    phone: str = Field(..., alias="phone")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class HotelUpdate(BaseModel):
    name: Optional[str] = Field(default=None, alias="name")
    type: Optional[str] = Field(default=None, alias="type")
    city: Optional[str] = Field(default=None, alias="city")
    address: Optional[str] = Field(default=None, alias="address")
    distance: Optional[str] = Field(default=None, alias="distance")
    photos: Optional[List[str]] = Field(default=None, alias="photos")
    title: Optional[str] = Field(default=None, alias="title")
    desc: Optional[str] = Field(default=None, alias="desc")
    rating: Optional[float] = Field(default=None, alias="rating")
    cheapest_price: Optional[float] = Field(default=None, alias="cheapestPrice")
    popular_hotel: Optional[bool] = Field(default=None, alias="popularHotel")
    comments: Optional[int] = Field(default=None, alias="comments")
    facilities: Optional[dict] = Field(default=None, alias="facilities")
    check_in_time: Optional[str] = Field(default=None, alias="checkInTime")
    check_out_time: Optional[str] = Field(default=None, alias="checkOutTime")
    coordinates: Optional[dict] = Field(default=None, alias="coordinates")
    email: Optional[str] = Field(default=None, alias="email")
    nearby_attractions: Optional[List[str]] = Field(default=None, alias="nearbyAttractions")
    phone: Optional[str] = Field(default=None, alias="phone")
