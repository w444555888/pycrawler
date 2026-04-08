from fastapi import APIRouter, Depends, File, UploadFile, Form, Query
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_session
from app.models.user import User
from app.services.auth_service import verify_token
from app.services.hotel_flash_sale_service import HotelFlashSaleService
from app.utils.response import success

router = APIRouter(tags=["hotelFlashSale"])


@router.get("")
async def list_hotel_flash_sales(
    active_only: Optional[bool] = Query(False, alias="activeOnly"),
    session: AsyncSession = Depends(get_session)
):
    """獲取飯店限時搶購活動列表"""
    query = {"activeOnly": active_only}
    sales = await HotelFlashSaleService.list_hotel_flash_sales(query, session)
    return success(data=sales)


@router.post("") 
async def create_hotel_flash_sale(
    data: dict,
    current_user: User = Depends(verify_token),
    session: AsyncSession = Depends(get_session)
):
    """創建飯店限時搶購活動"""
    sale = await HotelFlashSaleService.create_hotel_flash_sale(data, session)
    return success(data=sale, message="活動創建成功")


@router.get("/inventory/{sale_id}")
async def list_flash_sale_inventory(
    sale_id: str,
    current_user: User = Depends(verify_token)
):
    """查詢活動庫存"""
    inventories = await HotelFlashSaleService.list_flash_sale_inventory(sale_id)
    return success(data=inventories)


@router.put("/inventory")
async def update_flash_sale_inventory(
    data: dict,
    current_user: User = Depends(verify_token)
):
    """更新活動庫存"""
    sale_id = data.get("saleId")
    date = data.get("date") 
    total_rooms = data.get("totalRooms")
    
    inventory = await HotelFlashSaleService.update_flash_sale_inventory(
        sale_id, date, total_rooms
    )
    return success(data=inventory, message="庫存更新成功")


@router.post("/upload-banner")
async def upload_hotel_flash_sale_banner(
    banner: UploadFile = File(...),
    sale_id: Optional[str] = Form(None),
    current_user: User = Depends(verify_token)
):
    """上傳banner圖片"""
    if not banner.content_type.startswith("image/"):
        from app.utils.error_handler import raise_error
        raise_error(400, "請上傳圖片文件")
    
    file_content = await banner.read()
    banner_url = await HotelFlashSaleService.save_uploaded_banner(
        file_content, banner.filename, sale_id
    )
    
    return success(data={"bannerUrl": banner_url}, message="Banner上傳成功")


@router.post("/book")
async def book_hotel_flash_sale(
    data: dict,
    current_user: User = Depends(verify_token)
):
    """搶購飯店訂單"""
    sale_id = data.get("saleId")
    date = data.get("date")
    user_id = str(current_user.id)
    
    order = await HotelFlashSaleService.book_hotel_flash_sale(sale_id, user_id, date)
    return success(data=order, message="搶購成功！")


@router.get("/order/all")
async def get_all_hotel_flash_sale_orders(
    current_user: User = Depends(verify_token),
    session: AsyncSession = Depends(get_session)
):
    """後台查看所有限時搶購訂單"""
    orders = await HotelFlashSaleService.get_all_hotel_flash_sale_orders(session)
    return success(data=orders)


@router.get("/{sale_id}")
async def get_hotel_flash_sale_by_id(sale_id: str, session: AsyncSession = Depends(get_session)):
    """獲取單個限時搶購活動詳情"""
    sale = await HotelFlashSaleService.get_hotel_flash_sale_by_id(sale_id, session)
    return success(data=sale)


@router.put("/{sale_id}")
async def update_hotel_flash_sale(
    sale_id: str,
    data: dict,
    current_user: User = Depends(verify_token)
):
    """更新飯店限時搶購活動"""
    sale = await HotelFlashSaleService.update_hotel_flash_sale(sale_id, data)
    return success(data=sale, message="活動更新成功")


@router.delete("/{sale_id}")
async def delete_hotel_flash_sale(
    sale_id: str,
    current_user: User = Depends(verify_token)  
):
    """刪除飯店限時搶購活動"""
    await HotelFlashSaleService.delete_hotel_flash_sale(sale_id)
    return success(message="活動刪除成功")