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
        default=lambda: datetime.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.now(), 
        onupdate=lambda: datetime.now(),
        nullable=False
    )

    def update_timestamp(self):
        """手动更新时间戳"""
        self.updated_at = datetime.now()