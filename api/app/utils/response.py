import json
from app.core.config import settings
from pydantic import BaseModel
from datetime import datetime
from starlette.responses import JSONResponse


class CustomJSONResponse(JSONResponse):
    """
    自訂 JSONResponse，支援特殊類型序列化
    
    三層序列化架構：
    ├─ 第一層：success() → shallow copy（只複製外層，不遞迴）
    ├─ 第二層：exclude_keys_recursive() → 深層遞迴轉換 + 排除敏感欄位
    └─ 第三層：json_encoder() → json.dumps 自動遞迴調用，處理 datetime/BaseModel
    """
    def render(self, content: any) -> bytes:
        return json.dumps(
            content,
            ensure_ascii=False,
            default=self.json_encoder
        ).encode("utf-8")

    @staticmethod
    def json_encoder(obj):
        """
        【第三層】JSON 序列化器 - 由 json.dumps() 自動遞迴調用
        
        作用：處理 json.dumps() 無法直接序列化的物件類型
        遞迴方式：json.dumps 內部遍歷 dict/list 時，遇到特殊類型自動調用此函數
        
        處理流程：
        - datetime → ISO 格式字串
        - BaseModel → dict (via model_dump)
        - dict → 直接返回
        - 其他 → 嘗試 __str__ 轉換
        """
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, BaseModel):  # Pydantic 物件
            return obj.model_dump(by_alias=True, exclude_none=True)
        if isinstance(obj, dict):  # dict 類型
            return obj
        # fallback
        if hasattr(obj, "__str__"):
            return str(obj)
        raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")



# 【第二層】遞迴排除敏感欄位與序列化
def exclude_keys_recursive(obj, exclude_fields: list[str]):
    """
    【第二層】深層遞迴轉換 - 明確的遞迴函數
    
    作用：
    - 完整遞迴轉換 BaseModel → dict
    - 排除敏感欄位（例如 password）
    - 處理嵌套結構（dict、list）
    
    遞迴方式：函數主動調用自己
    ├─ 遍歷 dict 的所有鍵值 → 遞迴呼叫自己
    └─ 遍歷 list 的所有元素 → 遞迴呼叫自己
    
    使用時機：只在 success() 有 exclude_fields 參數時調用
    """
    if isinstance(obj, BaseModel):
        obj = obj.model_dump(by_alias=True, exclude_none=True)

    if isinstance(obj, dict):
        return {
            k: exclude_keys_recursive(v, exclude_fields)  # ← 自己呼叫自己（遞迴）
            for k, v in obj.items()
            if k not in exclude_fields  # ← 排除敏感欄位
        }

    elif isinstance(obj, list):
        return [exclude_keys_recursive(v, exclude_fields) for v in obj]  # ← 自己呼叫自己（遞迴）

    else:
        return obj



def success(
    status: int = 200,
    data: any = None,
    message: str = "",
    cookies: dict = None,
    exclude_fields: list[str] = None
):
    """
    【第一層】淺複製 - 建立統一格式的成功回應
    
    三層序列化協作流程：
    
    ┌─ 無 exclude_fields ─────────────────────────────────────────┐
    │ success() 不做任何轉換                                        │
    │      ↓                                                       │
    │ CustomJSONResponse(content={..., "data": User(...)})        │
    │      ↓                                                       │
    │ json.dumps(..., default=json_encoder)                      │
    │      ↓ json.dumps 內部遞迴遍歷                               │
    │ 【第三層】json_encoder() 自動調用                            │
    │      ├─ User(BaseModel) → json_encoder() → model_dump()   │
    │      └─ datetime → json_encoder() → isoformat()           │
    │      ↓                                                       │
    │ 完整 JSON 輸出（包含所有資料）                               │
    └─────────────────────────────────────────────────────────────┘
    
    ┌─ 有 exclude_fields ─────────────────────────────────────────┐
    │ success(data, exclude_fields=["password"])                 │
    │      ↓                                                       │
    │ 【第一層】shallow copy（dict/list）                          │
    │      ↓                                                       │
    │ 【第二層】exclude_keys_recursive() 明確遞迴                  │
    │      ├─ 遞迴轉換 BaseModel → dict                           │
    │      ├─ 遞迴排除 password 鍵                                 │
    │      └─ 處理所有嵌套結構                                     │
    │      ↓                                                       │
    │ CustomJSONResponse(content={..., "data": {...}})           │
    │ （此時已全是 dict/list，json_encoder 幾乎不被調用）         │
    │      ↓                                                       │
    │ 完整 JSON 輸出（password 已排除）                            │
    └─────────────────────────────────────────────────────────────┘

    Args:
        status (int): HTTP 狀態碼，預設 200。
        data (any): 回傳的資料，可以是 dict、list、BaseModel 或 None。
        message (str): 提示訊息，預設空字串。
        cookies (dict): 需要設定的 cookie 鍵值對 (key=value)，會附加到回應。
        exclude_fields (list[str]): 需要在輸出中排除的欄位名稱清單（例如密碼）。

    Returns:
        CustomJSONResponse: 包含格式化後 JSON 的回應物件
    """
     
    if data is not None:
        # 【第一層】shallow copy - 只複製外層，不遞迴內層
        if isinstance(data, BaseModel):
            data = data.model_dump(by_alias=True, exclude_none=True)
        elif isinstance(data, list):
            tmp = []
            for item in data:
                if isinstance(item, BaseModel):
                    tmp.append(item.model_dump(by_alias=True, exclude_none=True))
                elif isinstance(item, dict):
                    tmp.append(item.copy())  # ← shallow copy
                else:
                    tmp.append(item)
            data = tmp
        elif isinstance(data, dict):
            data = data.copy()  # ← shallow copy，内部的 BaseModel 還沒轉

        # 【第二層】若有敏感欄位需排除，調用 exclude_keys_recursive 進行深層遞迴轉換
        if exclude_fields:
            data = exclude_keys_recursive(data, exclude_fields)

    # 【第三層】交給 CustomJSONResponse 與 json_encoder 處理
    # json.dumps 會自動遞迴調用 json_encoder 處理無法序列化的物件
    resp = CustomJSONResponse(
        status_code=status,
        content={
            "success": True,
            "data": data if data is not None else {},
            "message": message
        }
    )

    if cookies:
        for k, v in cookies.items():
            if isinstance(v, dict):
                resp.set_cookie(
                    key=k,
                    value=v.get("value", ""),
                    httponly=v.get("httponly", True),
                    secure=v.get("secure", settings.NODE_ENV == "production"),
                    samesite=v.get("samesite", "none" if settings.NODE_ENV == "production" else "lax"),
                    max_age=v.get("max_age", 7 * 24 * 60 * 60),
                    path=v.get("path", "/")
                )
            else:
                resp.set_cookie(
                    key=k,
                    value=v,
                    httponly=True,
                    secure=settings.NODE_ENV == "production",
                    samesite="none" if settings.NODE_ENV == "production" else "lax",
                    max_age=7 * 24 * 60 * 60,
                    path="/"
                )
    return resp
