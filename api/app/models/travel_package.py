from datetime import datetime, timezone
from typing import List, Optional, Dict, Literal, TYPE_CHECKING
from sqlalchemy import String, Float, Integer, Text, JSON, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, Field, ValidationError
from app.db import Base
from app.models.validators import ValidatedJSONType, ValidatedListJSONType

if TYPE_CHECKING:
    from app.models.user import User

class TravelPackage(Base):
    """旅游套餐评论模型"""
    __tablename__ = "travel_package_reviews"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    package_id: Mapped[int] = mapped_column(ForeignKey("travel_packages.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    booking_id: Mapped[Optional[int]] = mapped_column(ForeignKey("travel_package_bookings.id"), nullable=True)
    
    # 评价内容
    rating: Mapped[float] = mapped_column(Float, nullable=False)  # 1-5 星级
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    photos: Mapped[List[str]] = mapped_column(JSON, nullable=False, default=[])
    
    # 细分评分
    value_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 性价比
    service_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 服务质量
    itinerary_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 行程安排
    
    # 状态
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    helpful_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # 时间戳
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