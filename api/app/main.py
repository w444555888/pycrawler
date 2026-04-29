# app/main.py
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging
import os

from app.core.config import settings
from app.routes import hotels, rooms, users, auth, order, flight, captcha, hotel_flash_sale, subscribe, travel_packages
from app.db import init_db
from app.utils.error_handler import http_error_handler, validation_exception_handler
from app.utils.file_utils import get_upload_dir
from app.scheduler import start_scheduler, stop_scheduler
from app.utils.redis_client import init_redis, close_redis

app = FastAPI(title="Hotel Booking API")

# 启动时初始化数据库和定时任务
@app.on_event("startup")
async def on_startup():
    await init_db()
    # 暂时禁用 Redis
    # await init_redis()  # 初始化 Redis
    await start_scheduler()  # 启动定时任务调度器

# 关闭时停止定时任务
@app.on_event("shutdown")
async def on_shutdown():
    await stop_scheduler()  # 停止定时任务调度器
    # await close_redis()  # 关闭 Redis 连接

# 設定 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "https://pycrawler-admin.onrender.com",
        "https://pycrawler-client.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 配置静态文件服务
uploads_dir = get_upload_dir()
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# 路由註冊
app.include_router(hotels.router, prefix="/api/v1/hotels")
app.include_router(rooms.router, prefix="/api/v1/rooms")
app.include_router(users.router, prefix="/api/v1/users")
app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(order.router, prefix="/api/v1/order")
app.include_router(flight.router, prefix="/api/v1/flight")
app.include_router(captcha.router, prefix="/api/v1/captcha")
app.include_router(hotel_flash_sale.router, prefix="/api/v1/hotelFlashSale")
app.include_router(subscribe.router, prefix="/api/v1/subscribe")
app.include_router(travel_packages.router, prefix="/api/v1/travel")

# 統一錯誤格式處理器
app.add_exception_handler(HTTPException, http_error_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

# 捕捉所有未處理的錯誤（兜底）
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.exception("Unhandled exception: %s", str(exc))
    return JSONResponse(
        status_code=500,
        content={
            "code": 500,
            "message": "伺服器錯誤",
            "details": str(exc)
        }
    )

# 根路由
@app.get("/")
async def root():
    return {"message": "FastAPI server running"}
