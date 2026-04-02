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


# Pydantic 模型用于 API 序列化
class UserCreate(BaseModel):
    username: str = Field(..., alias="username")
    email: EmailStr = Field(..., alias="email")
    password: str = Field(..., alias="password")
    is_admin: bool = Field(default=True, alias="isAdmin")
    address: Optional[str] = Field(default=None, alias="address")
    phone_number: Optional[str] = Field(default=None, alias="phoneNumber")
    real_name: Optional[str] = Field(default=None, alias="realName")


class UserResponse(BaseModel):
    id: int
    username: str = Field(..., alias="username") 
    email: str = Field(..., alias="email")
    is_admin: bool = Field(..., alias="isAdmin")
    address: Optional[str] = Field(default=None, alias="address")
    phone_number: Optional[str] = Field(default=None, alias="phoneNumber")
    real_name: Optional[str] = Field(default=None, alias="realName")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class UserUpdate(BaseModel):
    username: Optional[str] = Field(default=None, alias="username")
    email: Optional[EmailStr] = Field(default=None, alias="email")
    is_admin: Optional[bool] = Field(default=None, alias="isAdmin")
    address: Optional[str] = Field(default=None, alias="address")
    phone_number: Optional[str] = Field(default=None, alias="phoneNumber")
    real_name: Optional[str] = Field(default=None, alias="realName")
