# app/utils/file_utils.py
from app.core.config import settings

def build_file_url(path: str) -> str:
    """
    构建完整的文件URL
    
    Args:
        path: 相对路径，例如 "/uploads/hotelFlashSale/image.webp"
    
    Returns:
        完整的URL，例如 "http://localhost:8000/uploads/hotelFlashSale/image.webp"
    """
    if not path:
        return ""
    
    # 确保路径以 / 开头
    if not path.startswith("/"):
        path = "/" + path
    
    return settings.BASE_URL + path

def get_upload_dir(subpath: str = "") -> str:
    """
    获取上传目录的绝对路径
    
    Args:
        subpath: 子目录，例如 "hotelFlashSale"
    
    Returns:
        完整的上传目录路径
    """
    import os
    
    base_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    
    if subpath:
        return os.path.join(base_dir, subpath)
    
    return base_dir