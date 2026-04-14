from datetime import datetime, timezone
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, EmailStr, Field
from app.db import Base

if TYPE_CHECKING:
    from app.models.order import Order


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

    # 关系映射
    # orders: Mapped[List["Order"]] = relationship("Order", back_populates="user")
    # ├─ orders: 属性名，用于访问用户的所有订单 (user.orders)
    # ├─ Mapped[List["Order"]]: 类型注解
    # │  ├─ Mapped: SQLAlchemy 2.0 的映射字段标记
    # │  ├─ List: Python 列表类型，表示一对多关系
    # │  └─ "Order": 字符串引用目标模型，避免循环导入
    # ├─ relationship(): SQLAlchemy 关系定义函数
    # ├─ "Order": 目标模型名称 (字符串形式)
    # └─ back_populates="user": 双向关系，指向 Order 模型中的 user 属性
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="user")

    def update_timestamp(self):
        """手动更新时间戳"""
        self.updated_at = datetime.now()
