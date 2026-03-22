# 🐳 Docker 常用指令
功能模块	能做什么	端口
API 服务	提供所有后端 API，支持 SwaggerUI 文档	8000
数据库	存储所有预订数据 (用户、酒店、航班、订单)	27017
缓存	提供 Redis 缓存服务	6379


🔗 立即可访问
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

# 查看 MongoDB 容器日志
docker compose logs -f pycrawler-mongodb

# 查看最近 100 行日志
docker compose logs --tail 100
```

---

## 🐳 Docker 指令 (单个容器操作)

### 容器操作

```powershell
# 进入 API 容器 (交互式 shell)
docker exec -it pycrawler-api /bin/bash

# 进入 Redis 容器
docker exec -it pycrawler-redis /bin/sh

# 进入 MongoDB 容器
docker exec -it pycrawler-mongodb /bin/bash
```

### Redis 操作

```powershell
# 进入 Redis CLI
docker exec -it pycrawler-redis redis-cli

# 直接执行 Redis 命令
docker exec -it pycrawler-redis redis-cli PING
docker exec -it pycrawler-redis redis-cli DBSIZE
docker exec -it pycrawler-redis redis-cli KEYS "*"
docker exec -it pycrawler-redis redis-cli FLUSHDB     # 清空当前数据库
docker exec -it pycrawler-redis redis-cli FLUSHALL    # 清空所有数据库
```

### MongoDB 操作

```powershell
# 进入 MongoDB shell
docker exec -it pycrawler-mongodb mongosh -u admin -p password

# 直接查询数据库
docker exec -it pycrawler-mongodb mongosh admin -u admin -p password --eval "db.runCommand('ping')"
```

### 查看容器信息

```powershell
# 查看容器配置和运行信息
docker inspect pycrawler-api

# 查看容器占用的资源 (CPU, 内存)
docker stats pycrawler-api

# 查看容器内的进程
docker top pycrawler-api
```

### 清理

```powershell
# 清理所有停止的容器
docker container prune

# 清理所有未使用的镜像
docker image prune

# 清理所有未使用的卷
docker volume prune

# 清理所有（谨慎）
docker system prune -a
```

---

## 🔍 故障排查指令

```powershell
# 检查容器是否运行
docker ps | findstr pycrawler

# 查看容器详细错误日志
docker compose logs pycrawler-api | Select-String "error" -Context 5

# 检查网络连接
docker network inspect pycrawler_default

# 查看正在运行的所有镜像
docker images | findstr pycrawler

# 检查硬盘使用情况
docker system df
```

---

## 🚀 实用组合指令

### 完整重启流程

```powershell
# 1. 停止所有
docker compose down

# 2. 清理数据 (可选，保留数据库)
# docker volume prune

# 3. 强制重建并启动
docker compose up -d --build

# 4. 检查状态
docker compose ps
```

### 快速健康检查

```powershell
# 检查 Redis
docker exec pycrawler-redis redis-cli PING

# 检查 MongoDB
docker exec pycrawler-mongodb mongosh admin -u admin -p password --eval "db.runCommand('ping')"

# 检查 API
Invoke-WebRequest -Uri "http://localhost:8000" | Select-Object StatusCode
```

### 查看所有日志 (开发调试)

```powershell
# Terminal 1: API 日志
docker compose logs -f pycrawler-api

# Terminal 2: Redis 日志
docker compose logs -f pycrawler-redis

# Terminal 3: MongoDB 日志
docker compose logs -f pycrawler-mongodb
```

---

## 📊 日常工作流

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

## 💡 PowerShell 实用技巧

```powershell
# 实时监控所有日志（3 个终端自动打开）
# Terminal 1
docker compose logs -f pycrawler-api

# Terminal 2
docker compose logs -f pycrawler-redis

# Terminal 3
docker compose logs -f pycrawler-mongodb

# 快速查看是否有 error
docker compose logs | findstr "error" -Context 3

# 查看最后 50 行
docker compose logs --tail 50
```

---

## 🔗 本项目相关

- **API 文档**: http://localhost:8000/docs
- **Redis 监听**: localhost:6379 (容器内: redis:6379)
- **MongoDB 监听**: localhost:27017 (容器内: mongodb:27017)

