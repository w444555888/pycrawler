from typing import List
from beanie import PydanticObjectId
from app.models.subscribe import Subscribe
from app.utils.response import success
from app.utils.error_handler import raise_error


class SubscribeService:
    """訂閱服務"""

    @staticmethod
    async def add_subscribe(email: str) -> None:
        """新增訂閱（含寄信）"""
        if not email:
            raise_error(400, "Email 不得為空")

        # 检查是否已经订阅
        existing = await Subscribe.find_one(Subscribe.email == email.lower())
        if existing:
            raise_error(200, "Email 已訂閱過囉！")

        # 创建订阅
        new_sub = Subscribe(email=email.lower())
        await new_sub.save()

        # 发送欢迎邮件
        try:
            from app.utils.newsletter import NewsletterService
            await NewsletterService.send_welcome_email(email)
        except Exception as e:
            print(f"發送歡迎郵件失敗: {e}")
            # 即使邮件发送失败，订阅也应该成功

    @staticmethod
    async def get_all_subscribes() -> List[Subscribe]:
        """取得全部訂閱"""
        return await Subscribe.find_all().sort("-created_at").to_list()

    @staticmethod
    async def delete_subscribe(subscribe_id: str) -> None:
        """刪除訂閱"""
        if not PydanticObjectId.is_valid(subscribe_id):
            raise_error(400, "無效的訂閱ID")
            
        existing = await Subscribe.get(subscribe_id)
        if not existing:
            raise_error(404, "找不到此訂閱紀錄")

        await existing.delete()

    @staticmethod
    async def get_all_subscriber_emails() -> List[str]:
        """獲取所有訂閱者郵箱地址"""
        subscribers = await Subscribe.find_all().to_list()
        return [sub.email for sub in subscribers]