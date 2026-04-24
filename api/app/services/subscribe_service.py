from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.models.subscribe import Subscribe
from app.utils.response import success
from app.utils.error_handler import raise_error
from datetime import datetime


class SubscribeService:
    """訂閱服務"""

    @staticmethod
    async def add_subscribe(email: str, session: AsyncSession) -> None:
        """新增訂閱（含寄信）"""
        if not email:
            raise_error(400, "Email 不得為空")

        # 检查是否已经订阅
        stmt = select(Subscribe).where(Subscribe.email == email.lower())
        result = await session.execute(stmt)
        existing = result.scalar_one_or_none()
        
        if existing:
            raise_error(200, "Email 已訂閱過囉！")

        # 创建订阅
        new_sub = Subscribe(
            email=email.lower()
        )
        session.add(new_sub)
        await session.commit()

        # 发送欢迎邮件
        try:
            from app.utils.newsletter import NewsletterService
            await NewsletterService.send_welcome_email(email)
        except Exception as e:
            print(f"發送歡迎郵件失敗: {e}")
            # 即使邮件发送失败，订阅也应该成功

    @staticmethod
    async def get_all_subscribes(session: AsyncSession) -> List[Subscribe]:
        """取得全部訂閱"""
        stmt = select(Subscribe).order_by(Subscribe.created_at.desc())
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def delete_subscribe(subscribe_id: int, session: AsyncSession) -> None:
        """刪除訂閱"""
        stmt = select(Subscribe).where(Subscribe.id == subscribe_id)
        result = await session.execute(stmt)
        existing = result.scalar_one_or_none()
        
        if not existing:
            raise_error(404, "找不到此訂閱紀錄")

        await session.delete(existing)
        await session.commit()

    @staticmethod
    async def get_all_subscriber_emails(session: AsyncSession) -> List[str]:
        """獲取所有訂閱者郵箱地址"""
        stmt = select(Subscribe.email)
        result = await session.execute(stmt)
        emails = result.scalars().all()
        return list(emails)