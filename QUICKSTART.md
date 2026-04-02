# 🚀 Docker + Redis 完整配置启动


# 🐳 Docker 常用指令
功能模块	能做什么	端口
API 服務	提供所有后端 API，支持 SwaggerUI 文档	8000
Supabase PostgreSQL	云数据库存储所有预订数据 (用户、酒店、航班、订单)	5432
Redis 缓存	提供 Redis 缓存服务	6379


立即可访问
✅ API 文档 → http://localhost:8000/docs
✅ API 健康检测 → http://localhost:8000/

现在前端还没启动，需要另外运行：

Admin 管理后台: cd admin && npm start (端口 3000)
Client 客户端: cd client && npm start (端口 3001)


## 📋 Docker Compose 指令 (项目级别)

### 启动和停止

```powershell
# 启动所有服务 (后台运行)
docker compose up -d

# 启动所有服务 (前台运行，可查看日志)
docker compose up

# 停止所有服务
docker compose down

# 重启所有服务
docker compose restart

# 重建镜像并重启
docker compose up -d --build
```


### 查看状态

```powershell
# 查看所有运行中的容器
docker compose ps

# 查看详细状态 (包括端口映射)
docker compose ps -a
```

### 日志管理

```powershell
# 查看所有服务日志
docker compose logs

# 实时查看 API 容器日志 (最常用！)
docker compose logs -f pycrawler-api

# 查看 Redis 容器日志
docker compose logs -f pycrawler-redis

# 查看 API 容器日志
docker compose logs -f pycrawler-api

# 查看最近 100 行日志
docker compose logs --tail 100
```


**完整的本地开发环境：**
- 🟢 Redis (Docker)
- � Supabase PostgreSQL (云数据库)
- 🔵 FastAPI (Docker)

---


## 服务说明

| 服务 | 端口 | 说明 |
|------|------|------|
| Redis | 6379 | 缓存和会话 |
| Supabase PostgreSQL | 5432 | 云数据库 |
| API | 8000 | FastAPI 应用 |

---

## Redis

### 进入 Redis 容器


## 日常工作流

| 场景 | 指令 |
|------|------|
| **启动开发环境** | `docker compose up -d` |
| **查看 API 是否有错** | `docker compose logs -f pycrawler-api` |
| **重启 API** | `docker compose restart pycrawler-api` |
| **进入 API 容器调试** | `docker exec -it pycrawler-api /bin/bash` |
| **检查 Redis 缓存** | `docker exec -it pycrawler-redis redis-cli` |
| **清空 Redis 缓存** | `docker exec pycrawler-redis redis-cli FLUSHALL` |
| **停止所有服务** | `docker compose down` |
| **完整重启** | `docker compose down && docker compose up -d` |

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



## 文件结构

```
pycrawler/
├── docker-compose.yml       # 容器编排配置
├── pyproject.toml           # Python 依赖
├── poetry.lock              # 依赖锁文件(下指令本地更新 poetry.lock)
├── api/
│   ├── Dockerfile           # API 镜像配置
│   ├── app/
│   │   ├── main.py          # FastAPI 主文件（已集成 Redis）
│   │   └── utils/
│   │       └── redis_client.py  # Redis 工具类
│   └── ...
└── ...
```



