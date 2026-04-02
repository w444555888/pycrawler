#!/usr/bin/env python3
"""
Supabase 数据库连接测试脚本
用法: python test_connection.py
"""

import asyncio
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

async def test_database_connection():
    """测试 Supabase PostgreSQL 数据库连接"""
    
    try:
        import sys
        import os
        
        # 添加 API 路径到 Python 路径
        api_path = os.path.join(os.path.dirname(__file__), 'api')
        sys.path.insert(0, api_path)
        
        from app.db import engine, AsyncSessionLocal
        from sqlalchemy import text
        
        print("🔍 正在测试 Supabase 数据库连接...")
        print(f"📍 数据库 URL: {os.getenv('DATABASE_URL', '未设置')}")
        
        # 测试引擎连接
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT version()"))
            version = result.scalar()
            print(f"✅ 数据库连接成功!")
            print(f"📊 PostgreSQL 版本: {version[:50]}...")
            
        # 测试会话
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT current_database(), current_user"))
            db_info = result.fetchone()
            print(f"🗄️  当前数据库: {db_info[0]}")
            print(f"👤 当前用户: {db_info[1]}")
            
        # 测试表是否存在
        async with engine.begin() as conn:
            result = await conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            tables = [row[0] for row in result.fetchall()]
            
        print(f"\n📋 找到 {len(tables)} 个表:")
        expected_tables = [
            'users', 'hotels', 'rooms', 'orders', 'real_flight_orders',
            'room_inventories', 'subscribes', 'hotel_flash_sales', 
            'hotel_flash_sale_inventories', 'hotel_flash_sale_orders'
        ]
        
        for table in expected_tables:
            status = "✅" if table in tables else "❌"
            print(f"  {status} {table}")
            
        missing_tables = [t for t in expected_tables if t not in tables]
        if missing_tables:
            print(f"\n⚠️  缺少表: {', '.join(missing_tables)}")
            print("💡 请运行: alembic upgrade head")
        else:
            print("\n🎉 所有必需的表都存在!")
            
        return True
        
    except ImportError as e:
        print(f"❌ 导入错误: {e}")
        print("💡 请确保已安装依赖: pip install -r api/requirements.txt")
        return False
        
    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")
        print("\n🔧 请检查:")
        print("1. Supabase 项目是否正常运行")
        print("2. .env 文件中的 DATABASE_URL 是否正确")
        print("3. 数据库密码是否正确")
        print("4. 网络连接是否正常")
        return False

async def test_redis_connection():
    """测试 Redis 连接"""
    
    try:
        import redis.asyncio as redis
        
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
        print(f"\n🔍 正在测试 Redis 连接...")
        print(f"📍 Redis URL: {redis_url}")
        
        r = redis.from_url(redis_url)
        await r.ping()
        print("✅ Redis 连接成功!")
        
        # 测试读写
        await r.set("test_key", "test_value")
        value = await r.get("test_key")
        print(f"📝 测试读写: {value.decode() if value else 'None'}")
        await r.delete("test_key")
        
        await r.close()
        return True
        
    except ImportError:
        print("⚠️  Redis 库未安装，跳过 Redis 测试")
        return None
        
    except Exception as e:
        print(f"❌ Redis 连接失败: {e}")
        print("💡 Redis 是可选的，应用仍可正常运行")
        return False

def check_environment():
    """检查环境变量配置"""
    
    print("🔍 检查环境变量配置...")
    
    required_vars = {
        'DATABASE_URL': '数据库连接字符串',
        'DB_HOST': '数据库主机',
        'DB_PASSWORD': '数据库密码'
    }
    
    optional_vars = {
        'REDIS_URL': 'Redis 连接字符串',
        'AMADEUS_KEY': 'Amadeus API 密钥',
        'AMADEUS_SECRET': 'Amadeus API 密钥'
    }
    
    missing_required = []
    
    print("\n📋 必需的环境变量:")
    for var, desc in required_vars.items():
        value = os.getenv(var)
        if value:
            # 隐藏密码
            display_value = value if 'PASSWORD' not in var else '*' * len(value)
            print(f"  ✅ {var}: {display_value}")
        else:
            print(f"  ❌ {var}: 未设置 ({desc})")
            missing_required.append(var)
    
    print("\n📋 可选的环境变量:")
    for var, desc in optional_vars.items():
        value = os.getenv(var)
        status = "✅" if value else "⚠️ "
        display_value = value if value and 'SECRET' not in var and 'KEY' not in var else ('配置' if value else '未设置')
        print(f"  {status} {var}: {display_value}")
    
    if missing_required:
        print(f"\n❌ 缺少必需的环境变量: {', '.join(missing_required)}")
        print("💡 请检查 .env 文件配置")
        return False
        
    return True

async def main():
    """主测试函数"""
    
    print("🚀 Supabase 连接测试开始...\n")
    
    # 检查环境变量
    env_ok = check_environment()
    if not env_ok:
        return
    
    # 测试数据库连接
    db_ok = await test_database_connection()
    
    # 测试 Redis 连接
    redis_ok = await test_redis_connection()
    
    # 总结
    print("\n" + "="*50)
    print("📊 测试结果总结:")
    print(f"  🗄️  Supabase PostgreSQL: {'✅ 正常' if db_ok else '❌ 失败'}")
    print(f"  🔄 Redis: {'✅ 正常' if redis_ok else '❌ 失败' if redis_ok is False else '⚠️  跳过'}")
    
    if db_ok:
        print("\n🎉 数据库连接测试通过！可以启动应用了。")
        print("💡 下一步:")
        print("   1. cd api")
        print("   2. uvicorn app.main:app --reload --port 8000")
    else:
        print("\n❌ 请先解决数据库连接问题再启动应用。")

if __name__ == "__main__":
    asyncio.run(main())