import asyncpg
import asyncio

async def test_basic_connection():
    try:
        conn = await asyncpg.connect(
            'postgresql://postgres.riaktitavvoqpsodzhrb:w444555888r666777999@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'
        )
        version = await conn.fetchval('SELECT version()')
        print('✅ 连接成功!')
        print(f'PostgreSQL 版本: {version[:50]}...')
        await conn.close()
        return True
    except Exception as e:
        print(f'❌ 连接失败: {e}')
        return False

if __name__ == "__main__":
    asyncio.run(test_basic_connection())