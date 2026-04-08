from datetime import datetime, timezone
from typing import List, Optional, Literal, TYPE_CHECKING
from sqlalchemy import String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, Field
from app.db import Base

if TYPE_CHECKING:
    from app.models.user import User


class PassengerInfo(BaseModel):
    """乘客信息"""
    name: str = Field(..., alias="name")
    gender: Literal[0, 1] = Field(..., alias="gender")  # 0: 女, 1: 男
    birth_date: datetime = Field(..., alias="birthDate")
    passport_number: str = Field(..., alias="passportNumber")
    email: str = Field(..., alias="email")


class PriceInfo(BaseModel):
    """价格信息"""
    base_price: float = Field(..., alias="basePrice")
    tax: float = Field(..., alias="tax")
    total_price: float = Field(..., alias="totalPrice")


class PaymentInfo(BaseModel):
    """支付信息"""
    method: Optional[str] = Field(None, alias="method")
    transaction_id: Optional[str] = Field(None, alias="transactionId")
    paid_at: Optional[datetime] = Field(None, alias="paidAt")


class FlightInfo(BaseModel):
    """航班快照信息"""
    flight_id: Optional[str] = Field(None, alias="flightId")
    flight_number: str = Field(..., alias="flightNumber")
    airline: Optional[str] = Field(None, alias="airline")
    departure_airport: str = Field(..., alias="departureAirport")
    arrival_airport: str = Field(..., alias="arrivalAirport")
    departure_time: datetime = Field(..., alias="departureTime")
    arrival_time: datetime = Field(..., alias="arrivalTime")
    aircraft_code: Optional[str] = Field(None, alias="aircraftCode")
    itinerary_duration: Optional[str] = Field(None, alias="itineraryDuration")
    available_seats: Optional[int] = Field(None, alias="availableSeats")


class RealFlightOrders(Base):
    """真实航班订单模型"""
    __tablename__ = "real_flight_orders"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    order_number: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    flight_info: Mapped[dict] = mapped_column(JSON, nullable=False)  # FlightInfo 对象
    passenger_info: Mapped[List[dict]] = mapped_column(JSON, nullable=False)  # PassengerInfo 列表
    category: Mapped[str] = mapped_column(String(20), nullable=False)  # ECONOMY, BUSINESS, FIRST
    price: Mapped[dict] = mapped_column(JSON, nullable=False)  # PriceInfo 对象
    status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False)
    payment_info: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # PaymentInfo 对象
    
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
    user: Mapped["User"] = relationship("User")

    def update_timestamp(self):
        """手动更新时间戳"""
        self.updated_at = datetime.now()


# Pydantic 模型用于 API
class RealFlightOrdersCreate(BaseModel):
    user_id: int = Field(..., alias="userId")
    order_number: str = Field(..., alias="orderNumber")
    flight_info: FlightInfo = Field(..., alias="flightInfo")
    passenger_info: List[PassengerInfo] = Field(..., alias="passengerInfo")
    category: Literal["ECONOMY", "BUSINESS", "FIRST"] = Field(..., alias="category")
    price: PriceInfo = Field(..., alias="price")
    status: Literal["PENDING", "PAID", "CANCELLED", "COMPLETED"] = Field(default="PENDING", alias="status")
    payment_info: Optional[PaymentInfo] = Field(None, alias="paymentInfo")


class RealFlightOrdersResponse(BaseModel):
    id: int
    user_id: int = Field(..., alias="userId")
    order_number: str = Field(..., alias="orderNumber")
    flight_info: dict = Field(..., alias="flightInfo")
    passenger_info: List[dict] = Field(..., alias="passengerInfo")
    category: str = Field(..., alias="category")
    price: dict = Field(..., alias="price")
    status: str = Field(..., alias="status")
    payment_info: Optional[dict] = Field(None, alias="paymentInfo")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    
    class Config:
        from_attributes = True
        populate_by_name = True
