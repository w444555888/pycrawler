from datetime import datetime, timezone
from typing import List, Optional, Literal, TYPE_CHECKING
from sqlalchemy import String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, Field, ValidationError
from app.db import Base
from app.models.validators import ValidatedJSONType, ValidatedListJSONType

if TYPE_CHECKING:
    from app.models.user import User


class PassengerInfo(BaseModel):
    """乘客信息 - 驗證 JSON 結構"""
    name: str = Field(..., alias="name")
    gender: Literal[0, 1] = Field(..., alias="gender")  # 0: 女, 1: 男
    birth_date: datetime = Field(..., alias="birthDate")
    passport_number: str = Field(..., alias="passportNumber")
    email: str = Field(..., alias="email")


class PriceInfo(BaseModel):
    """价格信息 - 驗證 JSON 結構"""
    base_price: float = Field(..., alias="basePrice")
    tax: float = Field(..., alias="tax")
    total_price: float = Field(..., alias="totalPrice")


class PaymentInfo(BaseModel):
    """支付信息 - 驗證 JSON 結構"""
    method: Optional[str] = Field(None, alias="method")
    transaction_id: Optional[str] = Field(None, alias="transactionId")
    paid_at: Optional[datetime] = Field(None, alias="paidAt")


class FlightInfo(BaseModel):
    """航班快照信息 - 驗證 JSON 結構"""
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
    flight_info: Mapped[dict] = mapped_column(ValidatedJSONType(FlightInfo), nullable=False)
    passenger_info: Mapped[List[dict]] = mapped_column(ValidatedListJSONType(PassengerInfo), nullable=False)
    category: Mapped[str] = mapped_column(String(20), nullable=False)  # ECONOMY, BUSINESS, FIRST
    price: Mapped[dict] = mapped_column(ValidatedJSONType(PriceInfo), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False)
    payment_info: Mapped[Optional[dict]] = mapped_column(ValidatedJSONType(PaymentInfo), nullable=True)
    
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
