from sqlalchemy import Integer, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, Field
from datetime import datetime, timezone, date as date_type
from typing import Optional, TYPE_CHECKING
from app.db import Base

if TYPE_CHECKING:
    from app.models.room import Room


class RoomInventory(Base):
    """每日房间库存表"""
    __tablename__ = "room_inventories"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id"), nullable=False, index=True)
    date: Mapped[date_type] = mapped_column(Date, nullable=False)
    total_rooms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    booked_rooms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
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
    room: Mapped["Room"] = relationship("Room")

    # 创建唯一索引
    __table_args__ = (
        Index('ix_room_date', 'room_id', 'date', unique=True),
    )

    def update_timestamp(self):
        """手动更新时间戳"""
        self.updated_at = datetime.now(timezone.utc)

    @property
    def remaining_rooms(self) -> int:
        """虚拟字段：剩余房数"""
        return self.total_rooms - self.booked_rooms


# Pydantic 模型用于 API
class RoomInventoryCreate(BaseModel):
    room_id: int = Field(..., alias="roomId")
    date: date_type = Field(...)
    total_rooms: int = Field(default=0, alias="totalRooms")
    booked_rooms: int = Field(default=0, alias="bookedRooms")


class RoomInventoryResponse(BaseModel):
    id: int
    room_id: int = Field(..., alias="roomId")
    date: date_type = Field(...)
    total_rooms: int = Field(..., alias="totalRooms")
    booked_rooms: int = Field(..., alias="bookedRooms")
    remaining_rooms: int = Field(..., alias="remainingRooms")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    
    class Config:
        from_attributes = True
        populate_by_name = True