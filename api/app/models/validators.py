"""
JSON 驗證類型 - 使用 SQLAlchemy TypeDecorator
TypeDecorator 是 SQLAlchemy 用來「包裝/擴充資料庫欄位型別行為」的基底類別
"""

from sqlalchemy.types import TypeDecorator, JSON as JSON_SQLAlchemy
from pydantic import BaseModel, ValidationError
from typing import Type, Any, Optional


class ValidatedJSONType(TypeDecorator):
    """通用 JSON 驗證類型"""
    impl = JSON_SQLAlchemy
    cache_ok = True
    
    def __init__(self, pydantic_model: Type[BaseModel], *args, **kwargs):
        """
        Args:
            pydantic_model: 用於驗證的 Pydantic 模型類
        """
        super().__init__(*args, **kwargs)
        self.pydantic_model = pydantic_model
    
    def process_bind_param(self, value: Any, dialect) -> Optional[dict]:
        """寫入資料庫前驗證和轉換"""
        if value is None:
            return None
        
        if isinstance(value, dict):
            try:
                # 使用 Pydantic 模型驗證
                validated = self.pydantic_model(**value)
                # 轉換回 dict (使用 alias) - Pydantic v2
                return validated.model_dump(by_alias=True, mode='python')
            except ValidationError as e:
                raise ValueError(
                    f"{self.pydantic_model.__name__} 驗證失敗: {e.json()}"
                )
        
        raise TypeError(f"期望 dict，收到 {type(value)}")
    
    def process_result_value(self, value: Any, dialect) -> Optional[dict]:
        """從資料庫讀取後驗證"""
        if value is None:
            return None
        
        try:
            # 驗證從資料庫讀取的數據
            validated = self.pydantic_model(**value)
            return validated.model_dump(by_alias=True, mode='python')
        except ValidationError as e:
            raise ValueError(
                f"{self.pydantic_model.__name__} 讀取驗證失敗: {e.json()}"
            )


class ValidatedListJSONType(TypeDecorator):
    """JSON 列表驗證類型"""
    impl = JSON_SQLAlchemy
    cache_ok = True
    
    def __init__(self, pydantic_model: Type[BaseModel], *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.pydantic_model = pydantic_model
    
    def process_bind_param(self, value: Any, dialect) -> Optional[list]:
        """寫入資料庫前驗證"""
        if value is None:
            return None
        
        if isinstance(value, list):
            try:
                # 驗證每個列表項 - Pydantic v2
                validated_list = [
                    self.pydantic_model(**item).model_dump(by_alias=True, mode='python')
                    for item in value
                ]
                return validated_list
            except (ValidationError, TypeError) as e:
                raise ValueError(
                    f"{self.pydantic_model.__name__} 列表驗證失敗: {str(e)}"
                )
        
        raise TypeError(f"期望 list，收到 {type(value)}")
    
    def process_result_value(self, value: Any, dialect) -> Optional[list]:
        """從資料庫讀取後驗證"""
        if value is None:
            return None
        
        try:
            # 驗證每個列表項 - Pydantic v2
            validated_list = [
                self.pydantic_model(**item).model_dump(by_alias=True, mode='python')
                for item in value
            ]
            return validated_list
        except (ValidationError, TypeError) as e:
            raise ValueError(
                f"{self.pydantic_model.__name__} 列表讀取驗證失敗: {str(e)}"
            )
