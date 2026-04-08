from datetime import datetime, timedelta
from typing import List, Dict, Optional
import asyncio
from dateutil.parser import parse
import os
import uuid
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.models.hotel_flash_sale import HotelFlashSale, HotelFlashSaleInventory, HotelFlashSaleOrder
from app.models.hotel import Hotel  
from app.models.room import Room
from app.utils.response import success
from app.utils.error_handler import raise_error
from app.utils.file_utils import build_file_url


class HotelFlashSaleService:
    """飯店限時搶購服務"""

    @staticmethod
    async def list_hotel_flash_sales(query: Dict, session: AsyncSession) -> List[Dict]:
        """活動查詢"""
        active_only = query.get("activeOnly", False)
        now = datetime.now()
        
        if active_only:
            # 只查詢活躍的活動
            stmt = select(HotelFlashSale).where(
                HotelFlashSale.is_active == True,
                HotelFlashSale.start_time <= now,
                HotelFlashSale.end_time >= now
            ).order_by(HotelFlashSale.start_time)
        else:
            stmt = select(HotelFlashSale).order_by(HotelFlashSale.start_time)
            
        result = await session.execute(stmt)
        sales = result.scalars().all()

        # 序列化销售数据
        serialized_sales = []
        for sale in sales:
            sale_data = {
                "id": sale.id,
                "title": sale.title,
                "hotelId": sale.hotel_id,
                "roomId": sale.room_id,
                "basePrice": sale.base_price,
                "discountRate": sale.discount_rate,
                "startTime": sale.start_time.isoformat() if sale.start_time else None,
                "endTime": sale.end_time.isoformat() if sale.end_time else None,
                "quantityLimit": sale.quantity_limit,
                "soldCount": sale.sold_count,
                "bannerUrl": build_file_url(sale.banner_url) if sale.banner_url else "",
                "description": sale.description,
                "isActive": sale.is_active,
                "createdAt": sale.created_at.isoformat() if sale.created_at else None,
                "updatedAt": sale.updated_at.isoformat() if sale.updated_at else None
            }
            serialized_sales.append(sale_data)
        
        return serialized_sales

    @staticmethod
    async def get_hotel_flash_sale_by_id(sale_id: str) -> Dict:
        """取得單筆活動"""
        if not PydanticObjectId.is_valid(sale_id):
            raise_error(400, "無效的活動ID")
            
        sale = await HotelFlashSale.get(sale_id)
        if not sale:
            raise_error(404, "找不到此活動")
            
        # 手動序列化Link字段為字符串
        sale_data = {
            "id": str(sale.id),
            "title": sale.title,
            "hotelId": str(sale.hotel_id.ref.id) if hasattr(sale.hotel_id, 'ref') else str(sale.hotel_id),
            "roomId": str(sale.room_id.ref.id) if hasattr(sale.room_id, 'ref') else str(sale.room_id),
            "basePrice": sale.base_price,
            "discountRate": sale.discount_rate,
            "startTime": sale.start_time.isoformat() if sale.start_time else None,
            "endTime": sale.end_time.isoformat() if sale.end_time else None,
            "quantityLimit": sale.quantity_limit,
            "soldCount": sale.sold_count,
            "bannerUrl": build_file_url(sale.banner_url) if sale.banner_url else "",
            "description": sale.description,
            "isActive": sale.is_active,
            "createdAt": sale.created_at.isoformat() if sale.created_at else None,
            "updatedAt": sale.updated_at.isoformat() if sale.updated_at else None
        }
        
        return sale_data

    @staticmethod
    async def create_hotel_flash_sale(data: Dict, session: AsyncSession) -> Dict:
        """新增活動（同時生成每日庫存）"""
        required_fields = ["title", "hotelId", "roomId", "startTime", "endTime", "basePrice"]
        for field in required_fields:
            if not data.get(field):
                raise_error(400, f"缺少必要字段: {field}")

        hotel_id = data.get("hotelId")
        room_id = data.get("roomId")
        base_price = data.get("basePrice")

        if not base_price or base_price <= 0:
            raise_error(400, "請輸入有效的活動底價")

        # 验证酒店和房间存在
        hotel_stmt = select(Hotel).where(Hotel.id == hotel_id)
        room_stmt = select(Room).where(Room.id == room_id)
        
        hotel_result = await session.execute(hotel_stmt)
        room_result = await session.execute(room_stmt)
        
        hotel = hotel_result.scalar_one_or_none()
        room = room_result.scalar_one_or_none()
        
        if not hotel or not room:
            raise_error(404, "飯店或房型不存在")

        # 转换时间格式
        start_time = parse(data["startTime"]) if isinstance(data["startTime"], str) else data["startTime"]
        end_time = parse(data["endTime"]) if isinstance(data["endTime"], str) else data["endTime"]

        # 创建活动
        sale_data = {
            "title": data["title"],
            "hotel_id": hotel_id,
            "room_id": room_id, 
            "base_price": base_price,
            "discount_rate": data.get("discountRate", 1.0),
            "start_time": start_time,
            "end_time": end_time,
            "quantity_limit": data.get("quantityLimit", 0),
            "sold_count": 0,
            "banner_url": data.get("bannerUrl", ""),
            "description": data.get("description", ""),
            "is_active": data.get("isActive", True)
        }

        new_sale = HotelFlashSale(**sale_data)
        session.add(new_sale)
        await session.commit()
        await session.refresh(new_sale)

        # 生成每日庫存
        await HotelFlashSaleService._generate_daily_inventory(new_sale, session)

        # 返回序列化的数据
        return {
            "id": new_sale.id,
            "title": new_sale.title,
            "hotelId": new_sale.hotel_id,
            "roomId": new_sale.room_id,
            "basePrice": new_sale.base_price,
            "discountRate": new_sale.discount_rate,
            "startTime": new_sale.start_time.isoformat() if new_sale.start_time else None,
            "endTime": new_sale.end_time.isoformat() if new_sale.end_time else None,
            "quantityLimit": new_sale.quantity_limit,
            "soldCount": new_sale.sold_count,
            "bannerUrl": build_file_url(new_sale.banner_url) if new_sale.banner_url else "",
            "description": new_sale.description,
            "isActive": new_sale.is_active,
            "createdAt": new_sale.created_at.isoformat() if new_sale.created_at else None,
            "updatedAt": new_sale.updated_at.isoformat() if new_sale.updated_at else None
        }

    @staticmethod
    async def _generate_daily_inventory(sale: HotelFlashSale, session: AsyncSession) -> None:
        """生成每日库存"""
        current_date = sale.start_time.date()
        end_date = sale.end_time.date()
        
        inventories = []
        while current_date <= end_date:
            inventory = HotelFlashSaleInventory(
                sale_id=sale.id,
                date=current_date.strftime("%Y-%m-%d"),
                total_rooms=sale.quantity_limit,
                booked_rooms=0
            )
            inventories.append(inventory)
            current_date += timedelta(days=1)
        
        if inventories:
            session.add_all(inventories)
            await session.commit()

    @staticmethod
    async def update_hotel_flash_sale(sale_id: str, data: Dict) -> Dict:
        """更新活動"""
        if not PydanticObjectId.is_valid(sale_id):
            raise_error(400, "無效的活動ID")
            
        existing = await HotelFlashSale.get(sale_id)
        if not existing:
            raise_error(404, "找不到此活動")

        # 阻止更新的字段
        blocked_fields = ["hotelId", "roomId", "startTime", "endTime", "quantityLimit", "basePrice"]
        update_data = {k: v for k, v in data.items() if k not in blocked_fields}

        # 更新时间戳
        update_data["updated_at"] = datetime.now()

        await existing.update(Set(update_data))
        updated_sale = await HotelFlashSale.get(sale_id)
        
        # 返回序列化的数据
        return {
            "id": str(updated_sale.id),
            "title": updated_sale.title,
            "hotelId": str(updated_sale.hotel_id.ref.id) if hasattr(updated_sale.hotel_id, 'ref') else str(updated_sale.hotel_id),
            "roomId": str(updated_sale.room_id.ref.id) if hasattr(updated_sale.room_id, 'ref') else str(updated_sale.room_id),
            "basePrice": updated_sale.base_price,
            "discountRate": updated_sale.discount_rate,
            "startTime": updated_sale.start_time.isoformat() if updated_sale.start_time else None,
            "endTime": updated_sale.end_time.isoformat() if updated_sale.end_time else None,
            "quantityLimit": updated_sale.quantity_limit,
            "soldCount": updated_sale.sold_count,
            "bannerUrl": build_file_url(updated_sale.banner_url) if updated_sale.banner_url else "",
            "description": updated_sale.description,
            "isActive": updated_sale.is_active,
            "createdAt": updated_sale.created_at.isoformat() if updated_sale.created_at else None,
            "updatedAt": updated_sale.updated_at.isoformat() if updated_sale.updated_at else None
        }

    @staticmethod  
    async def delete_hotel_flash_sale(sale_id: str) -> bool:
        """刪除活動"""
        if not PydanticObjectId.is_valid(sale_id):
            raise_error(400, "無效的活動ID")
            
        sale = await HotelFlashSale.get(sale_id)
        if not sale:
            raise_error(404, "活動不存在")

        # 删除相关库存
        await HotelFlashSaleInventory.find(HotelFlashSaleInventory.sale_id == sale.id).delete()

        # 删除banner图片
        if sale.banner_url:
            try:
                banner_path = Path(sale.banner_url.lstrip("/"))
                if banner_path.exists() and "uploads/hotelFlashSale" in str(banner_path):
                    banner_path.unlink()
            except Exception as e:
                print(f"刪除圖片錯誤: {e}")

        await sale.delete()
        return True

    @staticmethod
    async def list_flash_sale_inventory(sale_id: str) -> List[Dict]:
        """查詢庫存"""
        if not PydanticObjectId.is_valid(sale_id):
            raise_error(400, "無效的活動ID")
            
        inventories = await HotelFlashSaleInventory.find(
            HotelFlashSaleInventory.sale_id == PydanticObjectId(sale_id)
        ).sort("date").to_list()
        
        # 序列化库存数据
        serialized_inventories = []
        for inventory in inventories:
            inventory_data = {
                "id": str(inventory.id),
                "saleId": str(inventory.sale_id.ref.id) if hasattr(inventory.sale_id, 'ref') else str(inventory.sale_id),
                "date": inventory.date,
                "totalRooms": inventory.total_rooms,
                "bookedRooms": inventory.booked_rooms,
                "createdAt": inventory.created_at.isoformat() if inventory.created_at else None,
                "updatedAt": inventory.updated_at.isoformat() if inventory.updated_at else None
            }
            serialized_inventories.append(inventory_data)
        
        return serialized_inventories

    @staticmethod
    async def update_flash_sale_inventory(sale_id: str, date: str, total_rooms: int) -> Dict:
        """更新庫存"""
        if not PydanticObjectId.is_valid(sale_id):
            raise_error(400, "無效的活動ID")

        inventory = await HotelFlashSaleInventory.find_one(
            HotelFlashSaleInventory.sale_id == PydanticObjectId(sale_id),
            HotelFlashSaleInventory.date == date
        )

        if inventory:
            inventory.total_rooms = total_rooms
            inventory.updated_at = datetime.now()
            await inventory.save()
        else:
            inventory = HotelFlashSaleInventory(
                sale_id=PydanticObjectId(sale_id),
                date=date,
                total_rooms=total_rooms,
                booked_rooms=0
            )
            await inventory.save()

        # 返回序列化的库存数据
        return {
            "id": str(inventory.id),
            "saleId": str(inventory.sale_id.ref.id) if hasattr(inventory.sale_id, 'ref') else str(inventory.sale_id),
            "date": inventory.date,
            "totalRooms": inventory.total_rooms,
            "bookedRooms": inventory.booked_rooms,
            "createdAt": inventory.created_at.isoformat() if inventory.created_at else None,
            "updatedAt": inventory.updated_at.isoformat() if inventory.updated_at else None
        }

    @staticmethod
    async def book_hotel_flash_sale(sale_id: str, user_id: str, date: str) -> Dict:
        """搶購訂單"""
        if not all([sale_id, user_id, date]):
            raise_error(400, "缺少必要參數")

        if not PydanticObjectId.is_valid(sale_id) or not PydanticObjectId.is_valid(user_id):
            raise_error(400, "無效的ID")

        # 获取活动信息
        sale = await HotelFlashSale.get(sale_id)
        if not sale:
            raise_error(404, "活動不存在")
            
        if not sale.is_active:
            raise_error(400, "活動尚未啟用")

        # 检查活动时间
        now = datetime.now()
        if now < sale.start_time or now > sale.end_time:
            raise_error(400, "活動不在有效期間")

        # 检查库存
        inventory = await HotelFlashSaleInventory.find_one(
            HotelFlashSaleInventory.sale_id == PydanticObjectId(sale_id),
            HotelFlashSaleInventory.date == date
        )
        
        if not inventory:
            raise_error(404, "找不到該日期的活動庫存")
            
        if inventory.booked_rooms >= inventory.total_rooms:
            raise_error(400, "該日期已售罄")

        # 检查用户是否已经预订过
        existing_order = await HotelFlashSaleOrder.find_one(
            HotelFlashSaleOrder.sale_id == PydanticObjectId(sale_id),
            HotelFlashSaleOrder.user_id == PydanticObjectId(user_id),
            HotelFlashSaleOrder.date == date
        )
        
        if existing_order:
            raise_error(400, "您已搶購過此日期的活動")

        # 计算价格
        base_price = sale.base_price or 0
        discount_rate = sale.discount_rate or 1
        final_price = round(base_price * discount_rate, 2)

        # 更新库存 (原子操作)
        updated_inventory = await HotelFlashSaleInventory.find_one(
            HotelFlashSaleInventory.sale_id == PydanticObjectId(sale_id),
            HotelFlashSaleInventory.date == date,
            HotelFlashSaleInventory.booked_rooms < inventory.total_rooms
        ).update(Inc({HotelFlashSaleInventory.booked_rooms: 1}))

        if not updated_inventory:
            raise_error(400, "庫存已售罄或更新失敗")

        # 创建订单
        new_order = HotelFlashSaleOrder(
            sale_id=PydanticObjectId(sale_id),
            user_id=PydanticObjectId(user_id),
            hotel_id=sale.hotel_id,
            room_id=sale.room_id,
            date=date,
            base_price=base_price,
            discount_rate=discount_rate,
            final_price=final_price,
            status="booked"
        )

        await new_order.save()
        
        # 返回序列化的订单数据
        return {
            "id": str(new_order.id),
            "saleId": str(new_order.sale_id.ref.id) if hasattr(new_order.sale_id, 'ref') else str(new_order.sale_id),
            "userId": str(new_order.user_id.ref.id) if hasattr(new_order.user_id, 'ref') else str(new_order.user_id),
            "hotelId": str(new_order.hotel_id.ref.id) if hasattr(new_order.hotel_id, 'ref') else str(new_order.hotel_id),
            "roomId": str(new_order.room_id.ref.id) if hasattr(new_order.room_id, 'ref') else str(new_order.room_id),
            "date": new_order.date,
            "discountRate": new_order.discount_rate,
            "basePrice": new_order.base_price,
            "finalPrice": new_order.final_price,
            "status": new_order.status,
            "createdAt": new_order.created_at.isoformat() if new_order.created_at else None,
            "updatedAt": new_order.updated_at.isoformat() if new_order.updated_at else None
        }

    @staticmethod
    async def get_all_hotel_flash_sale_orders(session: AsyncSession) -> List[Dict]:
        """後台查全部訂單"""
        stmt = select(HotelFlashSaleOrder).order_by(HotelFlashSaleOrder.created_at.desc())
        result = await session.execute(stmt)
        orders = result.scalars().all()
        
        # 序列化订单数据
        serialized_orders = []
        for order in orders:
            order_data = {
                "id": order.id,
                "saleId": order.sale_id,
                "userId": order.user_id,
                "hotelId": order.hotel_id,
                "roomId": order.room_id,
                "date": order.date,
                "discountRate": order.discount_rate,
                "basePrice": order.base_price,
                "finalPrice": order.final_price,
                "status": order.status,
                "createdAt": order.created_at.isoformat() if order.created_at else None,
                "updatedAt": order.updated_at.isoformat() if order.updated_at else None
            }
            serialized_orders.append(order_data)
        
        return serialized_orders

    @staticmethod 
    async def save_uploaded_banner(file_content: bytes, filename: str, sale_id: str = None) -> str:
        """保存上传的banner图片"""
        upload_dir = Path("uploads/hotelFlashSale")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # 生成唯一文件名
        file_extension = Path(filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = upload_dir / unique_filename
        
        # 保存文件
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # 如果提供了sale_id，删除旧的banner
        if sale_id and PydanticObjectId.is_valid(sale_id):
            sale = await HotelFlashSale.get(sale_id)
            if sale and sale.banner_url:
                old_path = Path(sale.banner_url.lstrip("/"))
                if old_path.exists() and "uploads/hotelFlashSale" in str(old_path):
                    old_path.unlink()
        
        return f"/uploads/hotelFlashSale/{unique_filename}"