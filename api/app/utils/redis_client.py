import json
import redis
from typing import Any, Optional
from app.core.config import settings

redis_client: Optional[redis.Redis] = None

async def init_redis():
    """初始化 Redis 连接"""
    global redis_client
    try:
        redis_url = getattr(settings, 'REDIS_URL', 'redis://localhost:6379/0')
        redis_client = redis.from_url(redis_url, decode_responses=True)
        redis_client.ping()
        print("✓ Redis 连接成功")
    except Exception as e:
        print(f"✗ Redis 连接失败: {e}")
        redis_client = None

async def close_redis():
    """关闭 Redis 连接"""
    global redis_client
    if redis_client:
        redis_client.close()
        print("✓ Redis 连接已关闭")

async def get_cache(key: str) -> Optional[Any]:
    """获取缓存"""
    try:
        if redis_client is None:
            return None
        value = redis_client.get(key)
        return json.loads(value) if value else None
    except Exception as e:
        print(f"缓存获取错误: {e}")
        return None

async def set_cache(key: str, value: Any, expire: int = 3600) -> bool:
    """设置缓存，默认过期时间 1 小时"""
    try:
        if redis_client is None:
            return False
        redis_client.setex(key, expire, json.dumps(value))
        return True
    except Exception as e:
        print(f"缓存设置错误: {e}")
        return False

async def delete_cache(key: str) -> bool:
    """删除缓存"""
    try:
        if redis_client is None:
            return False
        redis_client.delete(key)
        return True
    except Exception as e:
        print(f"缓存删除错误: {e}")
        return False