from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select 
from app.models.user import User
from app.models.order import Order
from app.models.real_flight_orders import RealFlightOrders
from app.utils.response import success
from app.utils.error_handler import raise_error
from passlib.hash import bcrypt
from typing import Dict


# 获取单个用户与其订单
async def get_user(user_id: int, current_user: dict, session: AsyncSession):
    if current_user["id"] != user_id and not current_user.get("isAdmin"):
        raise_error(403, "您沒有權限執行此操作")

    # 查询用户
    user_result = await session.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise_error(404, "找不到該使用者")

    # 查询普通订单
    orders_result = await session.execute(select(Order).where(Order.user_id == user_id))
    all_order = orders_result.scalars().all()

    # 查询航班订单
    flight_orders_result = await session.execute(select(RealFlightOrders).where(RealFlightOrders.user_id == user_id))
    raw_flight_orders = flight_orders_result.scalars().all()
    
    all_flight_order = []
    for order in raw_flight_orders:
        order_data = {
            "id": order.id,
            "userId": order.user_id,
            "orderNumber": order.order_number,
            "flightInfo": order.flight_info,
            "passengerInfo": order.passenger_info,
            "category": order.category,
            "price": order.price,
            "status": order.status,
            "paymentInfo": order.payment_info,
            "createdAt": order.created_at,
            "updatedAt": order.updated_at
        }
        all_flight_order.append(order_data)

    # 转换用户数据
    user_data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "isAdmin": user.is_admin,
        "address": user.address,
        "phoneNumber": user.phone_number,
        "realName": user.real_name,
        "createdAt": user.created_at,
        "updatedAt": user.updated_at
    }

    return success(
        data={
            "user": user_data,  
            "allOrder": [order.__dict__ for order in all_order],  
            "allFlightOrder": all_flight_order,
        },
        message="取得使用者資料成功"
    )


# 更新用户信息
async def update_user(user_id: int, data: dict, current_user: dict, session: AsyncSession):
    
    if current_user["id"] != user_id and not current_user.get("isAdmin"):
        raise_error(403, "您沒有權限執行此操作")

    required_fields = ["address", "phoneNumber", "realName"]
    missing = [field for field in required_fields if not data.get(field)]
    if missing:
        raise_error(400, f"缺少必要欄位：{', '.join(missing)}")

    # 查询用户
    user_result = await session.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise_error(404, "找不到該使用者")

    # 更新用户信息
    # 如果提供了密码且不为空，才更新密码
    if data.get("password") and data["password"].strip():
        user.password = bcrypt.hash(data["password"])
    
    user.address = data["address"]
    user.phone_number = data["phoneNumber"]
    user.real_name = data["realName"]
    user.update_timestamp()

    await session.commit()
    await session.refresh(user)

    # 转换返回数据
    user_data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "isAdmin": user.is_admin,
        "address": user.address,
        "phoneNumber": user.phone_number,
        "realName": user.real_name,
        "createdAt": user.created_at,
        "updatedAt": user.updated_at
    }

    return success(data=user_data, message="使用者資料更新成功")


# 删除用户
async def delete_user(user_id: int, current_user: dict, session: AsyncSession):
    if current_user["id"] != user_id and not current_user.get("isAdmin"):
        raise_error(403, "您沒有權限執行此操作")

    # 查询用户
    user_result = await session.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise_error(404, "找不到該使用者")

    await session.delete(user)
    await session.commit()
    
    return success(message="使用者已成功刪除")


# 获取全部用户（限管理员）
async def get_all_users(current_user: dict, session: AsyncSession):
    if not current_user.get("isAdmin"):
        raise_error(403, "只有管理員可以查看全部使用者")

    # 查询所有用户
    result = await session.execute(select(User))
    users = result.scalars().all()
    
    # 转换用户数据
    users_data = []
    for user in users:
        user_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "isAdmin": user.is_admin,
            "address": user.address,
            "phoneNumber": user.phone_number,
            "realName": user.real_name,
            "createdAt": user.created_at,
            "updatedAt": user.updated_at
        }
        users_data.append(user_data)

    return success(data=users_data, message="取得所有使用者成功")


