from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from pydantic import BaseModel, EmailStr, Field
from app.db import Base


class User(Base):
    """用户模型"""
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password: Mapped[str] = mapped_column(String(255), nullable=False)  # hashed password
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    phone_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    real_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    reset_password_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reset_password_expires: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
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
