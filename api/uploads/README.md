# Environment Configuration for Banner URLs

## Development (本地开发)
在开发环境中，你可以直接启动服务，banner URL会自动使用 localhost:

```bash
# .env 文件 (或直接在命令行设置)
BASE_URL=http://localhost:8000
NODE_ENV=development
```

## Production (生产环境)
在生产环境中，设置你的实际域名：

```bash
# 生产环境 .env 文件
BASE_URL=https://your-domain.com
NODE_ENV=production
```

## 使用示例

### 创建Flash Sale时
```json
{
  "title": "Test Sale",
  "hotelId": "1",
  "roomId": "1",
  "bannerUrl": "/uploads/hotelFlashSale/image.webp",
  "startTime": "2024-01-01T00:00:00",
  "endTime": "2024-01-02T00:00:00",
  "basePrice": 100
}
```

### API返回的格式
```json
{
  "code": 200,
  "message": "創建成功",
  "data": {
    "id": "1",
    "title": "Test Sale",
    "bannerUrl": "http://localhost:8000/uploads/hotelFlashSale/image.webp"
  }
}
```

## 静态文件访问
- 开发环境: `http://localhost:8000/uploads/hotelFlashSale/image.webp`
- 生产环境: `https://your-domain.com/uploads/hotelFlashSale/image.webp`

## 文件上传目录
Files are stored in: `api/uploads/hotelFlashSale/`