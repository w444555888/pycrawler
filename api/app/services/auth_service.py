from fastapi import HTTPException, Request, Response
from app.models.user import User
from app.utils.email_service import send_reset_email
from app.utils.response import success
from app.utils.error_handler import raise_error
from passlib.hash import bcrypt
from datetime import datetime, timezone, timedelta
import jwt
import os
import secrets

JWT_SECRET = os.getenv("JWT", "w444")
JWT_EXPIRE_HOURS = 168  # 對應 Node 7d = 168hr


# 設定 JWT Cookie
def set_token_cookie(token: str, max_age=7 * 24 * 60 * 60):
    return {
        "JWT_token": {
            "value": token,
            "httponly": True,
            "secure": os.getenv("NODE_ENV") == "production",
            "samesite": "none" if os.getenv("NODE_ENV") == "production" else "lax",
            "max_age": max_age,
            "path": "/"
        }
    }


# JWT 結構：
# Header	使用的演算法 (HS256)
# Payload	你設定的資料（id, isAdmin, exp）
# Signature	用密鑰簽名的驗證碼
def generate_token(user):
    # 要轉化為字串，因為 ObjectId 不是 JSON 可序列化的類型
    payload = {
        "id": str(user.id),
        "isAdmin": getattr(user, "is_admin", False),
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


async def register(data: dict):
    exists = await User.find_one({
        "$or": [
            {"username": data["username"]},
            {"email": data["email"]}
        ]
    })

    if exists:
        raise_error(400, "此帳號或信箱已被註冊")
    
    hashed_pwd = bcrypt.hash(data["password"])
    user = User(username=data["username"], email=data["email"], password=hashed_pwd)
    await user.insert()
    return success(data=user, message="註冊成功", exclude_fields=["password"])



async def login(data: dict):
    user = await User.find_one({
        "$or": [
            {"username": data["account"]},
            {"email": data["account"]}
        ]
    })

    if not user:
        raise_error(404, "沒有此使用者")
    
    if not bcrypt.verify(data["password"], user.password):
        raise_error(404, "輸入密碼錯誤")
    
    token = generate_token(user)
    cookie = set_token_cookie(token)

    return success(
        data={"userDetails": user},
        cookies=cookie,
        exclude_fields=["password"]
    )


async def forgot_password(data: dict):
    user = await User.find_one(User.email == data["email"])
    if not user:
        raise_error(404, "沒有此信箱的使用者")
    
    token = secrets.token_hex(16)
    user.resetPasswordToken = token
    user.resetPasswordExpires = datetime.now(timezone.utc) + timedelta(hours=1)
    await user.save()

    await send_reset_email(user.email, token)
    return success(message="重置密碼郵件已發送")


async def reset_password(token: str, new_password: str):
    user = await User.find_one({
        "resetPasswordToken": token,
        "resetPasswordExpires": {"$gt": datetime.now(timezone.utc)}
    })

    if not user:
        raise_error(404, "重置令牌無效或已過期")

    user.password = bcrypt.hash(new_password)
    user.resetPasswordToken = None
    user.resetPasswordExpires = None
    await user.save()
    return success(message="密碼重置成功")


def me(request: Request):
    user = getattr(request.state, "user", None)
    if not user:
        raise_error(401, "尚未登入")
    # 注意：這裡的 user 不是完整 DB user，而是 JWT decode 的 payload
    return success(data={"user": user})


def logout(response: Response):
    response.delete_cookie("JWT_token", path="/")
    return success(message="已登出")


def verify_token(request: Request):
    token = request.cookies.get("JWT_token")
    if not token:
        raise_error(401, "請先登入")
    
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        request.state.user = decoded
        return decoded
    except jwt.ExpiredSignatureError:
        raise_error(403, "登入已過期，請重新登入")
    except jwt.PyJWTError:
        raise_error(403, "無效的 Token")