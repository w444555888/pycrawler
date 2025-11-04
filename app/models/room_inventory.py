from beanie import Document, PydanticObjectId
from pydantic import Field, ConfigDict
from datetime import datetime, timezone, date
from typing import Optional
from pymongo import IndexModel
from app.models.room import Room 


class RoomInventory(Document):
    """每日房間庫存表 (對應 Node.js 的 RoomInventory 模型)"""
    model_config = ConfigDict(populate_by_name=True)
    room_id: PydanticObjectId = Field(..., alias="roomId")
    date: date
    total_rooms: int = Field(default=0, alias="totalRooms")
    booked_rooms: int = Field(default=0, alias="bookedRooms")

    created_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc), alias="createdAt")
    updated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc), alias="updatedAt")

    def update_timestamp(self):
        self.updated_at = datetime.now(timezone.utc)


    @property
    def remaining_rooms(self) -> int:
        """虛擬欄位：剩餘房數"""
        return self.total_rooms - self.booked_rooms

    
    class Settings:
        name = "roominventories"
        indexes = [
            IndexModel([("roomId", 1), ("date", 1)], unique=True) 
        ]