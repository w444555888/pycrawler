import asyncio
from datetime import datetime
from app.utils.email_service import send_email
from app.core.config import settings
from app.db import AsyncSessionLocal
import logging

logger = logging.getLogger(__name__)


class NewsletterService:
    """Newsletter 電子報服務"""
    
    @staticmethod
    async def send_daily_newsletter():
        """發送每日電子報"""
        try:
            # 創建數據庫會話
            async with AsyncSessionLocal() as session:
                # 獲取所有訂閱者郵箱
                from app.services.subscribe_service import SubscribeService
                subscriber_emails = await SubscribeService.get_all_subscriber_emails(session)
                
                if not subscriber_emails:
                    logger.info("無訂閱者，不寄送電子報")
                    return
                
                logger.info(f"開始發送電子報給 {len(subscriber_emails)} 位訂閱者")
                
                # 電子報內容
                subject = "今日最新優惠 - MIKE Booking"
                html_content = f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">今日最新優惠</h2>
                    <p>感謝您訂閱 MIKE.BOOKING 電子報！</p>
                    <p>我們為您精選了今日最優惠的旅遊資訊：</p>
                    
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #1f2937;">🏨 酒店限時搶購</h3>
                        <p>精選酒店限時優惠，數量有限，欲購從速！</p>
                    </div>
                    
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #1f2937;">✈️ 機票優惠</h3>
                        <p>熱門航線機票優惠，讓您輕鬆規劃下一趟旅程！</p>
                    </div>
                    
                    <p style="margin-top: 30px;">
                        立即前往 <a href="{settings.CLIENT_URL}" style="color: #2563eb;">MIKE.BOOKING</a> 
                        查看更多優惠！
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    
                    <p style="font-size: 12px; color: #6b7280;">
                        若您不想再收到此郵件，請聯繫客服告知。<br>
                        此郵件由 MIKE.BOOKING 系統自動發送，請勿直接回覆。
                    </p>
                </div>
                """
                
                # 發送郵件給每位訂閱者
                successful_count = 0
                failed_count = 0
                
                for email in subscriber_emails:
                    try:
                        await send_email(
                            to=email,
                            subject=subject,
                            html_content=html_content
                        )
                        successful_count += 1
                        logger.info(f"電子報發送成功: {email}")
                        
                        # 避免發送過快
                        await asyncio.sleep(0.5)
                        
                    except Exception as e:
                        failed_count += 1
                        logger.error(f"電子報發送失敗給 {email}: {e}")
                
                logger.info(f"電子報發送完成 - 成功: {successful_count}, 失敗: {failed_count}")
            
        except Exception as e:
            logger.error(f"發送每日電子報時發生錯誤: {e}")
    
    @staticmethod 
    async def send_welcome_email(email: str):
        """發送歡迎郵件給新訂閱者"""
        try:
            subject = "歡迎加入 MIKE.BOOKING 電子報！"
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">歡迎加入我們的電子報！</h2>
                <p>親愛的旅遊愛好者，</p>
                <p>感謝您訂閱 MIKE.BOOKING 電子報！我們很高興您加入我們的大家庭。</p>
                
                <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
                    <h3 style="color: #1e40af; margin-top: 0;">您將收到的內容：</h3>
                    <ul style="color: #374151;">
                        <li>🏨 獨家酒店限時優惠</li>
                        <li>✈️ 機票促銷資訊</li>
                        <li>🎯 個人化旅遊推薦</li>
                        <li>📧 每日精選優惠整理</li>
                    </ul>
                </div>
                
                <p>
                    立即前往 <a href="{settings.CLIENT_URL}" style="color: #2563eb; text-decoration: none; font-weight: bold;">MIKE.BOOKING</a> 
                    開始您的旅程！
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #6b7280;">
                    如果您不是本人訂閱，請忽略此郵件。<br>
                    此郵件由 MIKE.BOOKING 系統自動發送。
                </p>
            </div>
            """
            
            await send_email(
                to=email,
                subject=subject, 
                html_content=html_content
            )
            
            logger.info(f"歡迎郵件發送成功: {email}")
            
        except Exception as e:
            logger.error(f"發送歡迎郵件失敗給 {email}: {e}")
            raise e


# 定時任務函數
async def run_daily_newsletter():
    """執行每日電子報發送任務"""
    current_time = datetime.now()
    logger.info(f"開始執行每日電子報任務 - {current_time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    await NewsletterService.send_daily_newsletter()
    
    logger.info("每日電子報任務完成")
