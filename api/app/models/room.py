from datetime import datetime, timezone, timedelta
from typing import List, Literal, Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, Field
from dateutil.parser import parse as parse_date
from app.db import Base

if TYPE_CHECKING:
    from app.models.hotel import Hotel
    from app.models.order import Order


class Service(BaseModel):
    """房间服务信息"""
    parking: bool = Field(default=False, alias="parking")
    dinner: bool = Field(default=False, alias="dinner")
    breakfast: bool = Field(default=True, alias="breakfast")


class PaymentOption(BaseModel):
    """支付选项信息"""
    type: Literal['credit_card', 'paypal', 'bank_transfer', 'on_site_payment'] = Field(..., alias="type")
    description: str = Field(..., alias="description")
    refundable: bool = Field(default=False, alias="refundable")


class WeekdayPricing(BaseModel):
    """周日价格信息"""
    days_of_week: List[int] = Field(..., alias="days_of_week")  # [0=周日, 1=周一, ...]
    price: float = Field(..., alias="price")


class HolidayPricing(BaseModel):
    """假日价格信息"""
    date: str = Field(..., alias="date")  # "2025-12-25"
    price: float = Field(..., alias="price")


class Room(Base):
    """房间模型"""
    __tablename__ = "rooms"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    desc: Mapped[List[str]] = mapped_column(JSON, nullable=False)
    room_type: Mapped[str] = mapped_column(String(50), nullable=False)  # Single Room, Double Room, etc.
    max_people: Mapped[int] = mapped_column(Integer, nullable=False)
    service: Mapped[dict] = mapped_column(JSON, nullable=False)  # Service 对象
    hotel_id: Mapped[int] = mapped_column(ForeignKey("hotels.id"), nullable=False, index=True)
    payment_options: Mapped[List[dict]] = mapped_column(JSON, nullable=False)  # PaymentOption 列表
    pricing: Mapped[List[dict]] = mapped_column(JSON, nullable=False)  # WeekdayPricing 列表
    holidays: Mapped[List[dict]] = mapped_column(JSON, nullable=False)  # HolidayPricing 列表
    
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
    hotel: Mapped["Hotel"] = relationship("Hotel", back_populates="rooms")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="room")

    def update_timestamp(self):
        """手动更新时间戳"""
        self.updated_at = datetime.now(timezone.utc)

    def calculate_total_price(self, start_date: str, end_date: str) -> float:
        """计算房型在指定日期区间的总价格"""
        if not start_date or not end_date:
            print("缺少日期参数")
            return 0.0

        total_price = 0.0
        current_date = parse_date(start_date).date()
        end_date_obj = parse_date(end_date).date()
        if current_date >= end_date_obj:
            print("起讫日期不合法")
            return 0.0

        while current_date < end_date_obj:
            date_str = current_date.isoformat()
            node_day = (current_date.weekday() + 1) % 7  # Python周一=0 → Node周日=0

            # 假日优先
            holiday_price = None
            for h in self.holidays or []:
                if isinstance(h, dict):
                    date_val, price_val = h.get("date"), h.get("price")
                else:
                    date_val, price_val = getattr(h, "date", None), getattr(h, "price", None)

                if date_val == date_str:
                    holiday_price = float(price_val.get("$numberInt", price_val)) if isinstance(price_val, dict) else float(price_val)
                    break

            if holiday_price is not None:
                total_price += holiday_price
            else:
                found = False
                for p in self.pricing or []:
                    raw_days = p.get("days_of_week", []) if isinstance(p, dict) else getattr(p, "days_of_week", [])
                    normalized_days = [
                        int(d["$numberInt"]) if isinstance(d, dict) and "$numberInt" in d else int(d)
                        for d in raw_days or []
                    ]
                    price_val = p.get("price") if isinstance(p, dict) else getattr(p, "price", None)
                    price_value = float(price_val.get("$numberInt", price_val)) if isinstance(price_val, dict) else float(price_val or 0)

                    if node_day in normalized_days:
                        total_price += price_value
                        found = True
                        break

                if not found:
                    print("无匹配价格，略过")

            current_date += timedelta(days=1)

        print(f"总金额: {total_price}")
        return total_price


# Pydantic 模型用于 API
class RoomCreate(BaseModel):
    title: str = Field(..., alias="title")
    desc: List[str] = Field(..., alias="desc")
    room_type: Literal['Single Room', 'Double Room', 'Twin Room', 'Family Room', 'Deluxe Room', 'Triple Room'] = Field(..., alias="roomType")
    max_people: int = Field(..., alias="maxPeople")
    service: Service = Field(default_factory=Service, alias="service")
    hotel_id: int = Field(..., alias="hotelId")
    payment_options: List[PaymentOption] = Field(..., alias="paymentOptions")
    pricing: List[WeekdayPricing] = Field(..., alias="pricing")
    holidays: List[HolidayPricing] = Field(..., alias="holidays")


class RoomResponse(BaseModel):
    id: int
    title: str = Field(..., alias="title")
    desc: List[str] = Field(..., alias="desc")
    room_type: str = Field(..., alias="roomType")
    max_people: int = Field(..., alias="maxPeople")
    service: dict = Field(..., alias="service")
    hotel_id: int = Field(..., alias="hotelId")
    payment_options: List[dict] = Field(..., alias="paymentOptions")
    pricing: List[dict] = Field(..., alias="pricing")
    holidays: List[dict] = Field(..., alias="holidays")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class RoomUpdate(BaseModel):
    title: Optional[str] = Field(default=None, alias="title")
    desc: Optional[List[str]] = Field(default=None, alias="desc")
    room_type: Optional[str] = Field(default=None, alias="roomType")
    max_people: Optional[int] = Field(default=None, alias="maxPeople")
    service: Optional[dict] = Field(default=None, alias="service")
    payment_options: Optional[List[dict]] = Field(default=None, alias="paymentOptions")
    pricing: Optional[List[dict]] = Field(default=None, alias="pricing")
    holidays: Optional[List[dict]] = Field(default=None, alias="holidays")







