from typing import Optional, List, Literal, TYPE_CHECKING
from sqlalchemy import String, Float, Boolean, Integer, Text, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, EmailStr, Field, ValidationError
from datetime import datetime, timezone
from app.db import Base
from app.models.validators import ValidatedJSONType

if TYPE_CHECKING:
    from app.models.room import Room
    from app.models.order import Order


class Coordinates(BaseModel):
    """坐标信息 - 驗證 JSON 結構"""
    latitude: float = Field(..., alias="latitude")
    longitude: float = Field(..., alias="longitude")


class Facilities(BaseModel):
    """设施信息 - 驗證 JSON 結構"""
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
    facilities: Mapped[dict] = mapped_column(ValidatedJSONType(Facilities), nullable=False)
    check_in_time: Mapped[str] = mapped_column(String(10), nullable=False)
    check_out_time: Mapped[str] = mapped_column(String(10), nullable=False)
    coordinates: Mapped[dict] = mapped_column(ValidatedJSONType(Coordinates), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    nearby_attractions: Mapped[List[str]] = mapped_column(JSON, nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    
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
    rooms: Mapped[List["Room"]] = relationship("Room", back_populates="hotel")
    # 暂时注释掉 orders 关系，避免循环导入问题
    # orders: Mapped[List["Order"]] = relationship("Order", back_populates="hotel")

    def update_timestamp(self):
        """手动更新时间戳"""
        self.updated_at = datetime.now()
