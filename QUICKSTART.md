# 🚀 Docker + Redis 完整配置启动

## 📍 当前配置

**完整的本地开发环境：**
- 🟢 Redis (Docker)
- 🟡 MongoDB (Docker)
- 🔵 FastAPI (Docker)

---

## ✅ 启动步骤（网络正常时）

### 1️⃣ 确保在项目根目录

```powershell
cd C:\Users\mikeyu\Documents\GitHub\pycrawler
```

### 2️⃣ 启动所有服务

```powershell
docker compose up -d
```

等待完成，应该看到：
```
[+] up 3/3
 ✔ pycrawler-redis       Up
 ✔ pycrawler-mongodb     Up  
 ✔ pycrawler-api         Up
```

### 3️⃣ 验证所有服务

```powershell
docker compose ps
```

### 4️⃣ 访问应用

- 🔌 **API 文档**: http://localhost:8000/docs
- 📚 **Swagger UI**: http://localhost:8000/swagger

### 5️⃣ 检查 Redis 连接

```powershell
docker exec -it pycrawler-redis redis-cli PING
```

应该返回：`PONG`

---

## 📝 服务说明

| 服务 | 端口 | 说明 |
|------|------|------|
| Redis | 6379 | 缓存和会话 |
| MongoDB | 27017 | 数据库 |
| API | 8000 | FastAPI 应用 |

---

## 🧪 测试 Redis

### 进入 Redis 容器

```powershell
docker exec -it pycrawler-redis redis-cli
```

在 Redis 里执行：
```
PING                 # 返回 PONG
DBSIZE              # 显示键数量
KEYS *              # 列出所有键
SET test "hello"    # 设置测试键
GET test            # 获取测试键
```

### 验证 Redis 连接（通过 API 日志）

启动时应该看到：
```
✓ Redis 连接成功
```

---

## 🛑 停止服务

```powershell
docker compose down
```

---

## 🔄 重启服务

```powershell
docker compose restart
```

---

## 📜 查看日志

```powershell
# 看所有日志
docker compose logs -f

# 看特定服务日志
docker compose logs -f api
docker compose logs -f redis
docker compose logs -f mongodb
```

---

## ❌ 故障排除

### 问：容器启动失败？

```powershell
# 查看详细错误
docker compose logs

# 重建镜像
docker compose build --no-cache

# 重新启动
docker compose down
docker compose up -d
```

### 问：API 连不上 Redis？

```powershell
# 检查 Redis 是否运行
docker compose ps

# 重启 Redis
docker compose restart redis

# 查看 API 日志
docker compose logs api
```

### 问：清空所有容器和数据？

```powershell
docker compose down -v
```

---

## 🎯 使用 Redis 示例

在你的 route 里添加缓存：

```python
from app.utils.redis_client import get_cache, set_cache

@router.get("/hotels")
async def get_all_hotels():
    # 尝试从 Redis 获取
    cached = await get_cache("hotels:list")
    if cached:
        return {"source": "cache", "data": cached}
    
    # 从数据库获取
    hotels = await Hotel.find_all().to_list()
    result = [h.model_dump() for h in hotels]
    
    # 保存到 Redis（1 小时过期）
    await set_cache("hotels:list", result, expire=3600)
    
    return {"source": "database", "data": result}
```

---

## 📋 文件结构

```
pycrawler/
├── docker-compose.yml       # 容器编排配置
├── pyproject.toml           # Python 依赖
├── poetry.lock              # 依赖锁文件
├── api/
│   ├── Dockerfile           # API 镜像配置
│   ├── app/
│   │   ├── main.py          # FastAPI 主文件（已集成 Redis）
│   │   └── utils/
│   │       └── redis_client.py  # Redis 工具类
│   └── ...
└── ...
```

---

祝你学习愉快！🚀

