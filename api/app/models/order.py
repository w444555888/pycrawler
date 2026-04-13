from datetime import datetime, timezone
from typing import Literal, Optional, TYPE_CHECKING
from sqlalchemy import String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, Field, ValidationError
import secrets
from app.db import Base
from app.models.validators import ValidatedJSONType

if TYPE_CHECKING:
    from app.models.hotel import Hotel
    from app.models.room import Room
    from app.models.user import User


class Payment(BaseModel):
    """支付信息 - 驗證 JSON 結構"""
    method: Literal['credit_card', 'paypal', 'bank_transfer', 'on_site_payment'] = Field(
        default='on_site_payment',
        alias="method"
    )
    status: Literal['pending', 'paid', 'failed', 'refunded'] = Field(
        default='pending',
        alias="status"
    )
    transaction_id: str = Field(
        default_factory=lambda: secrets.token_hex(16),
        alias="transactionId"
    )


class Order(Base):
    """订单模型"""
    __tablename__ = "orders"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    hotel_id: Mapped[int] = mapped_column(ForeignKey("hotels.id"), nullable=False, index=True)
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id"), nullable=False, index=True)
    check_in_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    check_out_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    total_price: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default='pending', nullable=False)
    payment: Mapped[dict] = mapped_column(ValidatedJSONType(Payment), nullable=False)  # 驗證 Payment JSON
    
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
    # 暂时移除 back_populates，避免循环导入问题
    hotel: Mapped["Hotel"] = relationship("Hotel")
    room: Mapped["Room"] = relationship("Room")

    def update_timestamp(self):
        """手动更新时间戳"""
        self.updated_at = datetime.now()
