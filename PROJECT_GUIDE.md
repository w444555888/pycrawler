# 🏨 PyCrawler Booking System - 完整部署指南

一个基于 **FastAPI** 和 **Supabase** (PostgreSQL) 的现代化酒店预订系统。

## 🌟 功能特性

- 🏨 **酒店管理**: 酒店信息、房间类型、库存管理
- ✈️ **航班预订**: 集成 Amadeus API 的航班搜索和预订  
- 💰 **限时促销**: 酒店限时特价活动
- 👥 **用户管理**: 用户注册、登录、订单管理
- 📧 **邮件订阅**: 促销通知订阅系统
- 🔒 **管理后台**: 完整的后台管理界面

## 🛠 技术栈

### 后端 (API)
- **FastAPI**: 现代化 Python Web 框架
- **SQLAlchemy 2.0**: 异步 ORM  
- **Supabase**: PostgreSQL 云数据库
- **Redis**: 会话存储和缓存
- **Amadeus API**: 航班数据接口

### 前端
- **React.js**: 用户界面 (client/)
- **React Admin**: 管理后台 (admin/) 
- **TypeScript**: 类型安全
- **SCSS**: 样式预处理器

### 🔄 迁移说明
本项目已从 **MongoDB + Beanie** 成功迁移到 **Supabase (PostgreSQL) + SQLAlchemy**：
- **数据库**: MongoDB Atlas → Supabase (PostgreSQL 17.6)
- **ORM**: Beanie ODM → SQLAlchemy 2.0 (异步)
- **驱动**: Motor → asyncpg + Supavisor (IPv4 兼容)
- **架构**: 完整的数据库表结构设计

## 🚀 完整设置指南

### 步骤 1: 克隆项目
```bash
git clone https://github.com/your-repo/pycrawler.git
cd pycrawler
```

### 步骤 2: 创建 Supabase 项目

#### 2.1 注册并创建项目
1. 访问 [supabase.com](https://supabase.com)
2. 点击 **Start your project** 按钮
3. 使用 GitHub 账号快速注册
4. 点击 **New Project**
5. 填写项目信息：
   - **Name**: `pycrawler-booking`
   - **Database Password**: 设置强密码（至少8位，包含数字和字母）
   - **Region**: 选择 `Southeast Asia (Singapore)` 
   - **Pricing Plan**: `Free` （足够开发使用）

#### 2.2 获取连接信息
1. 项目创建完成后，点击右上角绿色 **"Connect"** 按钮
2. **选择 "Pooler" 选项卡**（重要：IPv4 兼容）
3. **选择 "Session" 模式**
4. 复制连接信息，类似：
```
Host: aws-1-ap-southeast-1.pooler.supabase.com
Database: postgres
Port: 5432  
User: postgres.your_project_id
```

### 步骤 3: 配置环境变量

#### 3.1 复制环境配置模板
```bash
cp .env.example .env
```

#### 3.2 编辑 .env 文件
```bash
# Supabase PostgreSQL Configuration (使用 Pooler IPv4)
DB_HOST=aws-1-ap-southeast-1.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.your_project_id
DB_PASSWORD=your_supabase_password
DATABASE_URL=postgresql+asyncpg://postgres.your_project_id:your_password@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# Amadeus API Configuration  
AMADEUS_KEY=47FraKn90PbAmZ79AMT2mCKMTUHxNNVG
AMADEUS_SECRET=2tzRCn2qBInDGM9A
```

### 步骤 4: 安装依赖

#### 4.1 Python 依赖 (使用 Poetry)
```bash
poetry install
```

#### 4.2 前端依赖
```bash
# 用户端
cd client
npm install

# 管理后台
cd admin
npm install
```

### 步骤 5: 数据库初始化
启动 API 服务器时会自动创建所有数据库表，无需手动操作。

### 步骤 6: 启动服务

#### 6.1 启动后端 API
```bash
cd api
poetry run uvicorn app.main:app --reload --port 8000
```

#### 6.2 启动前端服务
```bash
# 用户端 (新终端)
cd client  
npm start
# 访问: http://localhost:3000

# 管理后台 (新终端)
cd admin
npm start  
# 访问: http://localhost:3001
```

## ✅ 部署检查清单

在启动应用之前，请确认以下项目都已完成：

### 🗄️ 数据库配置
- [ ] 已创建 Supabase 项目
- [ ] 已获取 **Pooler** 连接信息（IPv4 兼容）
- [ ] 已更新 `.env` 文件中的所有数据库配置
- [ ] 数据库连接测试通过

### 📦 依赖安装
- [ ] Python 依赖: `poetry install`  
- [ ] 前端依赖: `npm install` (client/ 和 admin/)
- [ ] 确认 `asyncpg >= 0.29.0`

### 🛠️ 数据库迁移
- [ ] 数据库表自动创建成功
- [ ] 在 Supabase Dashboard 中确认创建了 10 个表：
  - [ ] `users`, `hotels`, `rooms`
  - [ ] `orders`, `real_flight_orders`
  - [ ] `room_inventories`, `subscribes`
  - [ ] `hotel_flash_sales`, `hotel_flash_sale_inventories`, `hotel_flash_sale_orders`

### 🚀 服务启动 
- [ ] API 服务启动成功: http://localhost:8000/docs
- [ ] 用户端启动成功: http://localhost:3000
- [ ] 管理后台启动成功: http://localhost:3001

### 🧪 连接测试
```bash
# 测试数据库连接
poetry run python test_connection.py

# 测试 API 健康检查
curl http://localhost:8000/
```

## 📊 数据库结构

| 表名 | 说明 | 关键字段 |
|-----|-----|---------|
| `users` | 用户表 | id, username, email, password, is_admin |
| `hotels` | 酒店表 | id, name, type, city, photos (JSON) |
| `rooms` | 房间表 | id, hotel_id, title, pricing (JSON) |
| `orders` | 订单表 | id, user_id, hotel_id, payment (JSON) |
| `real_flight_orders` | 航班订单表 | id, user_id, flight_info (JSON) |
| `subscribes` | 邮件订阅表 | id, email |
| `hotel_flash_sales` | 限时促销表 | id, hotel_id, discount_rate |

## 🔧 API 端点

### 🔐 认证相关
- `POST /login` - 用户登录
- `POST /register` - 用户注册  
- `POST /logout` - 用户退出

### 🏨 酒店相关
- `GET /hotels` - 获取酒店列表
- `GET /hotels/{id}` - 酒店详情
- `GET /hotels/{id}/rooms` - 酒店房间

### 📋 订单相关  
- `POST /orders` - 创建订单
- `GET /orders` - 获取订单列表
- `GET /orders/{id}` - 订单详情

### ✈️ 航班相关
- `GET /flights/search` - 航班搜索
- `POST /flights/book` - 航班预订

**完整 API 文档**: http://localhost:8000/docs

## 🚀 生产部署

### 推荐云平台
- **Vercel**: 前端部署 + Edge Functions API 部署
- **Railway**: 全栈容器部署  
- **Render**: 简单易用的应用部署
- **DigitalOcean**: App Platform 一键部署

### Docker 容器部署
```bash
# 构建镜像
docker build -t pycrawler-api .

# 运行容器
docker run -p 8000:8000 --env-file .env pycrawler-api
```

### 生产环境变量
```bash
# 生产环境配置
DATABASE_URL=postgresql+asyncpg://postgres.project_id:password@aws-region.pooler.supabase.com:5432/postgres
REDIS_URL=redis://your-redis-cloud-url:6379
AMADEUS_KEY=your_production_amadeus_key
AMADEUS_SECRET=your_production_amadeus_secret
```

## 📋 项目结构

```
pycrawler/
├── api/                    # FastAPI 后端
│   ├── app/
│   │   ├── core/          # 配置和设置
│   │   ├── models/        # SQLAlchemy 数据模型  
│   │   ├── routes/        # API 路由
│   │   ├── services/      # 业务逻辑服务
│   │   └── utils/         # 工具函数
│   ├── alembic/           # [已删除] 数据库通过模型自动创建
│   └── requirements.txt   # Python 依赖
├── client/                # React 用户端
├── admin/                 # React 管理后台
├── docker-compose.yml     # 本地开发环境  
└── README.md             # 项目文档
```

## 🧪 测试

```bash
# API 单元测试  
cd api
poetry run pytest

# 前端测试
cd client
npm test

cd admin
npm test
```

## 🌟 Supabase 优势

相比之前的 MongoDB，现在享受：
- **🚀 更好性能**: PostgreSQL 查询优化
- **💰 成本更低**: 免费 500MB 数据库  
- **🔒 更安全**: 行级安全 + 内置认证
- **📊 直观管理**: Web Dashboard 数据管理
- **🌍 全球 CDN**: 更快访问速度
- **🔄 实时订阅**: WebSocket 实时更新

## ❗ 重要注意事项

### IPv6/IPv4 兼容性
- ✅ **使用 Pooler 连接**: 确保 IPv4 网络兼容
- ❌ **避免 Direct 连接**: 可能有 IPv6 兼容问题

### 连接字符串格式
```bash
# ✅ 正确 (Pooler IPv4)
postgresql+asyncpg://postgres.project_id:password@aws-region.pooler.supabase.com:5432/postgres

# ❌ 错误 (Direct IPv6) 
postgresql+asyncpg://postgres:password@db.project_id.supabase.co:5432/postgres
```

## 🔧 故障排除

### 常见问题解决

#### 1. 数据库连接失败
```
asyncpg.exceptions.InvalidPasswordError
```
**解决方案**: 
- 检查 `.env` 文件中的密码是否正确
- 确认使用 Pooler 连接而非 Direct 连接

#### 2. DNS 解析失败
```  
[Errno 11001] getaddrinfo failed
```
**解决方案**:
- 确认网络能访问外部服务
- 使用 Pooler IPv4 连接而非 Direct IPv6

#### 3. 数据库表创建失败
**解决方案**:
```bash
# 重启 API 服务器，会自动重新创建表
poetry run uvicorn app.main:app --reload --port 8000
```

## 🤝 贡献

1. Fork 项目
2. 创建功能分支: `git checkout -b feature-name`
3. 提交更改: `git commit -m 'Add feature'` 
4. 推送分支: `git push origin feature-name`
5. 提交 Pull Request

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)

## 📞 支持

- 📧 邮件: support@example.com
- 🐛 问题报告: [GitHub Issues](https://github.com/your-repo/pycrawler/issues)
- 📖 文档: [项目文档](https://your-docs-url.com)

## 📝 更新日志

### v2.0.0 (2026-04-02)
- ✨ **重大更新**: 从 MongoDB 迁移到 Supabase (PostgreSQL)
- 🚀 **性能优化**: SQLAlchemy 2.0 异步查询 + IPv4 Pooler
- 🔧 **新增功能**: SQLAlchemy 自动表创建机制
- 📊 **架构优化**: 重构数据库结构和索引

### v1.0.0 (2023-12-01)  
- 🎉 初始版本发布
- 🏨 酒店预订核心功能
- ✈️ 航班预订集成
- 👥 用户管理系统

---

**🎉 恭喜！你的现代化酒店预订系统已成功部署到 Supabase！**

⭐ **如果这个项目对你有帮助，请给个星标支持！**