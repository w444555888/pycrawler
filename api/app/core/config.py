# 載入 python-dotenv 模組，用來從 .env 檔案讀取環境變數
from dotenv import load_dotenv
# os 模組用來操作環境變數、路徑等
import os
from pathlib import Path

# 获取项目根目录的 .env 文件 
project_root = Path(__file__).parent.parent.parent.parent
env_path = project_root / ".env"

# 執行 dotenv 載入
load_dotenv(dotenv_path=env_path)
class Settings:
    # PostgreSQL 数据库连接字符串 (Supabase)
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:w444555888r666777999@db.riaktitavvoqpsodzhrb.supabase.co:5432/postgres")
    
    # 从环境变量中获取 REDIS 的设定值，若未设定则使用预设值 "redis://localhost:6379/0"
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # PostgreSQL 数据库配置参数 (Supabase Supavisor)
    DB_HOST = os.getenv("DB_HOST", "aws-1-ap-southeast-1.pooler.supabase.com")
    DB_PORT = int(os.getenv("DB_PORT", "5432"))
    DB_NAME = os.getenv("DB_NAME", "postgres")
    DB_USER = os.getenv("DB_USER", "postgres.riaktitavvoqpsodzhrb")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "your_password")
    
    # JWT Configuration
    JWT_SECRET = os.getenv("JWT", "w444")
    
    # Email Configuration
    EMAIL = os.getenv("EMAIL")
    EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
    
    # Environment
    NODE_ENV = os.getenv("NODE_ENV", "development")
    
    # Base URL for file serving
    BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
    
    # 从环境变量中取得 AVIATIONSTACK 的设定值，若未设定则使用预设值
    AVIATIONSTACK_KEY = os.getenv("AVIATIONSTACK_KEY", "b732bfbbfee6c50404ed1b0b0bac15a2")
    
    # Foursquare API Configuration
    FOURSQUARE_API_KEY = os.getenv("FOURSQUARE_API_KEY", "IMDFNRKJWFPFOW1FLAD5NMX5WK1LMFLSAE2XYP0GZTCK05XK")
    FOURSQUARE_CLIENT_ID = os.getenv("FOURSQUARE_CLIENT_ID", "1G0OIZVFOWV4FDKUOEOB4TOQBYZUAOJ4JZBI2FNGNTGTK4AH")
    FOURSQUARE_CLIENT_SECRET = os.getenv("FOURSQUARE_CLIENT_SECRET", "LPMXINT0NOOGIKLSCPSYW3J00TXA1NWYGNE5BRMSX3L04WHD")

    # 前端部屬域名
    CLIENT_URL = os.getenv("CLIENT_URL", "https://pycrawler-client.onrender.com")
    
    # 經緯度
    OPENCAGE_API_KEY = os.getenv("OPENCAGE_API_KEY", "f0c040b99ba34dc5bea782add240d870")
    @property
    def database_url(self) -> str:
        """动态构建数据库 URL"""
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
# 建立設定實例供其他模組匯入使用
settings = Settings()
