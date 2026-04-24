"""
定時任務調度器 - 用於定時發送電子報等任務
1. 在 FastAPI 應用中背景執行

"""

import asyncio
import logging
from datetime import datetime, time
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

# 設置日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def daily_newsletter_job():
    """每日電子報任務包裝器"""
    try:
        from app.utils.newsletter import run_daily_newsletter
        await run_daily_newsletter()
    except Exception as e:
        logger.error(f"執行每日電子報任務失敗: {e}")


class TaskScheduler:
    """任務調度器"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
    
    def setup_jobs(self):
        """設置定時任務"""
        # 每天 09:00 發送電子報
        self.scheduler.add_job(
            daily_newsletter_job,
            CronTrigger(hour=9, minute=0, second=0),  # 每天 09:00:00
            id='daily_newsletter',
            name='每日電子報發送',
            replace_existing=True
        )
        
        logger.info("已設置定時任務：每日電子報發送 (每天 09:00)")
    
    def start(self):
        """啟動調度器"""
        self.setup_jobs()
        self.scheduler.start()
        logger.info("任務調度器已啟動")
    
    def shutdown(self):
        """關閉調度器"""
        self.scheduler.shutdown()
        logger.info("任務調度器已關閉")


# 全局調度器實例
task_scheduler = TaskScheduler()


async def start_scheduler():
    """啟動調度器（在 FastAPI 應用啟動時調用）"""
    task_scheduler.start()


async def stop_scheduler():
    """停止調度器（在 FastAPI 應用關閉時調用）"""
    task_scheduler.shutdown()
