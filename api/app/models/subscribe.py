from datetime import datetime, timezone
from typing import Optional
from pydantic import EmailStr, ConfigDict, Field
from beanie import Document


class Subscribe(Document):
    """訂閱"""
    model_config = ConfigDict(populate_by_name=True)

    email: EmailStr = Field(..., unique=True, description="邮箱地址")

    created_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc), alias="createdAt")
    updated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc), alias="updatedAt")

    class Settings:
        name = "subscribes"