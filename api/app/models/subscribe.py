from datetime import datetime, timezone
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from pydantic import BaseModel, EmailStr, Field
from app.db import Base


class Subscribe(Base):
    """订阅模型"""
    __tablename__ = "subscribes"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    
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

    def update_timestamp(self):
        """手动更新时间戳"""
        self.updated_at = datetime.now(timezone.utc)


# Pydantic 模型用于 API
class SubscribeCreate(BaseModel):
    email: EmailStr = Field(..., alias="email")


class SubscribeResponse(BaseModel):
    id: int
    email: str = Field(..., alias="email")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    
    class Config:
        from_attributes = True
        populate_by_name = True