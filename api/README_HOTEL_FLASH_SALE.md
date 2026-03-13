# 酒店限時搶購和訂閱功能移植

本文档說明了從 Node.js 項目移植到 Python FastAPI 的酒店限時搶購和訂閱功能。

## 🏨 酒店限時搶購功能

### 新增的文件：
- `models/hotel_flash_sale.py` - 數據模型（活動、庫存、訂單）
- `services/hotel_flash_sale_service.py` - 業務邏輯服務
- `routes/hotel_flash_sale.py` - API 路由

### API 端點：
- `GET /api/v1/hotelFlashSale` - 獲取活動列表
- `POST /api/v1/hotelFlashSale` - 創建新活動
- `GET /api/v1/hotelFlashSale/{id}` - 獲取單個活動
- `PUT /api/v1/hotelFlashSale/{id}` - 更新活動
- `DELETE /api/v1/hotelFlashSale/{id}` - 刪除活動
- `GET /api/v1/hotelFlashSale/inventory/{saleId}` - 查詢庫存
- `PUT /api/v1/hotelFlashSale/inventory` - 更新庫存  
- `POST /api/v1/hotelFlashSale/upload-banner` - 上傳 Banner 圖片
- `POST /api/v1/hotelFlashSale/book` - 搶購預訂
- `GET /api/v1/hotelFlashSale/order/all` - 後台查看所有訂單

### 功能特性：
- ✅ 自動生成每日庫存
- ✅ 搶購時庫存原子性操作
- ✅ Banner 圖片上傳管理
- ✅ 活動時間驗證
- ✅ 用戶重複搶購檢查
- ✅ 價格計算和折扣應用

## 📧 訂閱功能

### 新增的文件：
- `models/subscribe.py` - 訂閱數據模型
- `services/subscribe_service.py` - 訂閱服務
- `routes/subscribe.py` - API 路由
- `utils/newsletter.py` - 電子報工具

### API 端點：
- `POST /api/v1/subscribe` - 新增訂閱
- `GET /api/v1/subscribe` - 獲取所有訂閱
- `DELETE /api/v1/subscribe/{id}` - 刪除訂閱

### 功能特性：
- ✅ 自動發送歡迎郵件
- ✅ 每日電子報定時發送
- ✅ HTML 格式郵件模板
- ✅ 重複訂閱檢查

## 🔧 安裝依賴

```bash
# 如果要使用定時任務功能，需要安裝：
pip install apscheduler

# 如果要使用日期解析功能，需要安裝：
pip install python-dateutil
```

## ⏰ 設置定時任務

有多種方式可以設置定時任務發送每日電子報：

### 方式1: 使用 APScheduler (推薦)
```python
# 在 main.py 中添加
from app.scheduler import start_scheduler, stop_scheduler

@app.on_event("startup")
async def on_startup():
    await init_db()
    await start_scheduler()  # 啟動調度器

@app.on_event("shutdown") 
async def on_shutdown():
    await stop_scheduler()  # 停止調度器
```

### 方式2: 直接運行調度器
```bash
python -m app.scheduler
```

### 方式3: 使用系統 cron (Linux/Mac)
```bash
# 編輯 crontab
crontab -e

# 添加以下行（每天 9 點執行）
0 9 * * * cd /path/to/project && python -c "import asyncio; from app.utils.newsletter import run_daily_newsletter; asyncio.run(run_daily_newsletter())"
```

### 方式4: 手動觸發電子報
```python
from app.utils.newsletter import run_daily_newsletter
import asyncio

# 手動執行一次
asyncio.run(run_daily_newsletter())
```

## 📁 目錄結構更新

```
api/app/
├── models/
│   ├── hotel_flash_sale.py      # 🆕 酒店搶購相關模型
│   └── subscribe.py             # 🆕 訂閱模型
├── services/
│   ├── hotel_flash_sale_service.py  # 🆕 酒店搶購服務
│   └── subscribe_service.py         # 🆕 訂閱服務
├── routes/
│   ├── hotel_flash_sale.py      # 🆕 酒店搶購路由
│   └── subscribe.py             # 🆕 訂閱路由
├── utils/
│   ├── newsletter.py            # 🆕 電子報工具
│   └── email_service.py         # ✅ 更新：添加 HTML 郵件支持
├── scheduler.py                 # 🆕 定時任務調度器
└── main.py                      # ✅ 更新：添加新路由註冊
```

## 🌐 環境變數設置

確保設置以下環境變數用於郵件發送：

```bash
EMAIL="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
```

## 🧪 測試 API

### 測試訂閱功能：
```bash
# 訂閱郵箱
curl -X POST "http://localhost:8000/api/v1/subscribe" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# 獲取所有訂閱
curl -X GET "http://localhost:8000/api/v1/subscribe" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 測試酒店搶購功能：
```bash
# 創建搶購活動
curl -X POST "http://localhost:8000/api/v1/hotelFlashSale" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "春節限時搶購",
    "hotelId": "HOTEL_ID",
    "roomId": "ROOM_ID", 
    "basePrice": 1000,
    "discountRate": 0.8,
    "startTime": "2024-01-01T00:00:00Z",
    "endTime": "2024-01-07T23:59:59Z",
    "quantityLimit": 10
  }'

# 搶購預訂
curl -X POST "http://localhost:8000/api/v1/hotelFlashSale/book" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "saleId": "SALE_ID",
    "date": "2024-01-03"  
  }'
```

## 📝 注意事項

1. 確保MongoDB中有對應的 hotels 和 rooms 集合數據
2. 郵件功能需要正確設置SMTP設定
3. 文件上傳目錄需要有寫入權限 (`uploads/hotelFlashSale/`)
4. 時間相關功能使用UTC時間
5. 搶購功能使用了原子操作確保數據一致性

## 🔄 從原 Node.js 項目的變化

### 主要改進：
- 使用 Pydantic 進行數據驗證
- 使用 Beanie ORM 簡化資料庫操作  
- 更好的型別提示和錯誤處理
- 優化的郵件模板設計
- 支持多種定時任務部署方式

### 保持一致的功能：
- ✅ 所有原有API端點
- ✅ 相同的業務邏輯流程
- ✅ 資料庫模型結構
- ✅ 錯誤訊息和響應格式