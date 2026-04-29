from datetime import datetime, timezone
from typing import List, Optional, Dict, Literal, TYPE_CHECKING
from sqlalchemy import String, Float, Integer, Text, JSON, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, Field, ValidationError
from app.db import Base
from app.models.validators import ValidatedJSONType, ValidatedListJSONType

if TYPE_CHECKING:
    from app.models.hotel import Hotel
    from app.models.user import User


class AttractionInfo(BaseModel):
    """景点信息 - 验证 JSON 结构"""
    fsq_id: str = Field(..., description="Foursquare 地点ID")
    name: str = Field(..., description="景点名称")
    category: str = Field(..., description="景点类别")
    address: str = Field(..., description="地址")
    distance: Optional[int] = Field(None, description="距离（米）")
    rating: Optional[float] = Field(None, description="评分")
    price_level: Optional[int] = Field(None, description="价格等级 1-4")
    photos: Optional[List[str]] = Field(default=[], description="照片URL列表")
    opening_hours: Optional[Dict] = Field(None, description="营业时间")
    description: Optional[str] = Field(None, description="描述")
    coordinates: Optional[Dict[str, float]] = Field(None, description="坐标 {lat, lng}")


class RestaurantInfo(BaseModel):
    """餐厅信息 - 验证 JSON 结构"""
    fsq_id: str = Field(..., description="Foursquare 地点ID")
    name: str = Field(..., description="餐厅名称")
    category: str = Field(..., description="餐厅类别")
    address: str = Field(..., description="地址")
    distance: Optional[int] = Field(None, description="距离（米）")
    rating: Optional[float] = Field(None, description="评分")
    price_level: Optional[int] = Field(None, description="价格等级 1-4")
    photos: Optional[List[str]] = Field(default=[], description="照片URL列表")
    opening_hours: Optional[Dict] = Field(None, description="营业时间")
    cuisine_type: Optional[str] = Field(None, description="菜系类型")
    coordinates: Optional[Dict[str, float]] = Field(None, description="坐标 {lat, lng}")


class ItineraryDay(BaseModel):
    """行程单日安排 - 验证 JSON 结构"""
    day: int = Field(..., description="第几天")
    title: str = Field(..., description="当日主题")
    description: Optional[str] = Field(None, description="当日描述")
    attractions: List[AttractionInfo] = Field(default=[], description="景点列表")
    restaurants: List[RestaurantInfo] = Field(default=[], description="餐厅列表")
    estimated_cost: Optional[float] = Field(None, description="预估当日花费")
    travel_tips: Optional[str] = Field(None, description="旅行贴士")


class WeatherInfo(BaseModel):
    """天气信息 - 验证 JSON 结构"""
    temperature_avg: Optional[float] = Field(None, description="平均温度")
    temperature_range: Optional[Dict[str, float]] = Field(None, description="温度范围 {min, max}")
    humidity: Optional[int] = Field(None, description="湿度百分比")
    weather_condition: Optional[str] = Field(None, description="天气状况")
    best_visit_months: Optional[List[str]] = Field(default=[], description="最佳旅游月份")
    rainfall: Optional[float] = Field(None, description="降雨量")


class PriceBreakdown(BaseModel):
    """价格明细 - 验证 JSON 结构"""
    base_price: float = Field(..., description="基础价格")
    hotel_cost: Optional[float] = Field(None, description="住宿费用")
    attraction_cost: Optional[float] = Field(None, description="景点门票费用")
    meal_cost: Optional[float] = Field(None, description="餐饮费用")
    transport_cost: Optional[float] = Field(None, description="交通费用")
    service_fee: Optional[float] = Field(None, description="服务费")
    total_price: float = Field(..., description="总价格")
    currency: str = Field(default="USD", description="货币单位")


class TravelPackage(Base):
    """旅游套餐模型"""
    __tablename__ = "travel_packages"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    short_description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # 地理信息
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    country: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    coordinates: Mapped[Optional[Dict]] = mapped_column(JSON, nullable=True)
    
    # 套餐基本信息
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    max_participants: Mapped[int] = mapped_column(Integer, default=20, nullable=False)
    min_participants: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    difficulty_level: Mapped[str] = mapped_column(String(20), default="easy", nullable=False)  # easy, moderate, hard
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # cultural, adventure, family, romantic, etc.
    
    # 价格信息
    price_breakdown: Mapped[Dict] = mapped_column(ValidatedJSONType(PriceBreakdown), nullable=False)
    
    # 行程安排
    itinerary: Mapped[List[Dict]] = mapped_column(ValidatedListJSONType(ItineraryDay), nullable=False)
    
    # 附加信息
    weather_info: Mapped[Optional[Dict]] = mapped_column(ValidatedJSONType(WeatherInfo), nullable=True)
    photos: Mapped[List[str]] = mapped_column(JSON, nullable=False, default=[])
    included_services: Mapped[List[str]] = mapped_column(JSON, nullable=False, default=[])
    excluded_services: Mapped[List[str]] = mapped_column(JSON, nullable=False, default=[])
    
    # 状态和元数据
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    reviews_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    booking_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.now(), 
        onupdate=lambda: datetime.now(),
        nullable=False
    )

    # 关系映射
    bookings: Mapped[List["TravelPackageBooking"]] = relationship("TravelPackageBooking", back_populates="package")

    def calculate_base_price_per_person(self) -> float:
        """计算每人基础价格"""
        return self.price_breakdown.get("base_price", 0.0)
    
    def get_total_price(self, participants: int = 1) -> float:
        """计算总价格"""
        base_price = self.price_breakdown.get("total_price", 0.0)
        return base_price * participants
    
    def update_timestamp(self):
        """手动更新时间戳"""
        self.updated_at = datetime.now()


class TravelPackageBooking(Base):
    """旅游套餐预订模型"""
    __tablename__ = "travel_package_bookings"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    package_id: Mapped[int] = mapped_column(ForeignKey("travel_packages.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    
    # 预订基本信息
    booking_number: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    participants_count: Mapped[int] = mapped_column(Integer, nullable=False)
    travel_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    
    # 参与者信息
    participant_details: Mapped[List[Dict]] = mapped_column(JSON, nullable=False)
    
    # 价格和支付
    total_price: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    payment_status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    payment_method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # 状态
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)  # pending, confirmed, cancelled, completed
    
    # 联系信息
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    special_requests: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.now(), 
        onupdate=lambda: datetime.now(),
        nullable=False
    )

    # 关系映射
    package: Mapped["TravelPackage"] = relationship("TravelPackage", back_populates="bookings")
    user: Mapped["User"] = relationship("User")

    def generate_booking_number(self) -> str:
        """生成预订号"""
        import secrets
        import string
        timestamp = datetime.now().strftime("%Y%m%d")
        random_code = ''.join(secrets.choices(string.ascii_uppercase + string.digits, k=6))
        return f"TP{timestamp}{random_code}"

    def update_timestamp(self):
        """手动更新时间戳"""
        self.updated_at = datetime.now()


class TravelPackageReview(Base):
    """旅游套餐评论模型"""
    __tablename__ = "travel_package_reviews"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    package_id: Mapped[int] = mapped_column(ForeignKey("travel_packages.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    booking_id: Mapped[Optional[int]] = mapped_column(ForeignKey("travel_package_bookings.id"), nullable=True)
    
    # 评价内容
    rating: Mapped[float] = mapped_column(Float, nullable=False)  # 1-5 星级
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    photos: Mapped[List[str]] = mapped_column(JSON, nullable=False, default=[])
    
    # 细分评分
    value_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 性价比
    service_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 服务质量
    itinerary_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 行程安排
    
    # 状态
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    helpful_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.now(), 
        onupdate=lambda: datetime.now(),
        nullable=False
    )

    # 关系映射
    package: Mapped["TravelPackage"] = relationship("TravelPackage")
    user: Mapped["User"] = relationship("User")
    booking: Mapped[Optional["TravelPackageBooking"]] = relationship("TravelPackageBooking")

    def update_timestamp(self):
        """手动更新时间戳"""
        self.updated_at = datetime.now()