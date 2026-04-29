import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { request } from '../utils/apiService';
import './travelPackageDetail.scss';

const TravelPackageDetail = () => {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redux state
  const user = useSelector(state => state.user);
  
  // Component state
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('itinerary');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Booking form state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    participantsCount: 1,
    travelDate: '',
    contactEmail: user.userInfo?.email || '',
    contactPhone: '',
    specialRequests: '',
    participantDetails: []
  });

  // 获取套餐详情
  const fetchPackageDetail = async () => {
    setLoading(true);
    const res = await request('GET', `/travel/packages/${packageId}`, {}, setLoading);
    if (res.success) {
      setPackageData(res.data);
      initializeParticipantDetails(res.data.minParticipants);
      setError(null);
    } else {
      setError(res.message || '获取套餐详情失败');
    }
    setLoading(false);
  };

  // 初始化参与者详情
  const initializeParticipantDetails = (minParticipants) => {
    const details = Array(minParticipants).fill().map((_, index) => ({
      name: '',
      email: '',
      phone: '',
      passportNumber: '',
      birthDate: '',
      specialNeeds: ''
    }));
    
    setBookingData(prev => ({
      ...prev,
      participantsCount: minParticipants,
      participantDetails: details
    }));
  };

  // 更新参与者数量
  const updateParticipantsCount = (count) => {
    if (!packageData) return;
    
    const newCount = Math.max(packageData.minParticipants, Math.min(count, packageData.maxParticipants));
    const currentDetails = bookingData.participantDetails;
    
    let newDetails;
    if (newCount > currentDetails.length) {
      // 添加新参与者
      const additionalDetails = Array(newCount - currentDetails.length).fill().map(() => ({
        name: '',
        email: '',
        phone: '',
        passportNumber: '',
        birthDate: '',
        specialNeeds: ''
      }));
      newDetails = [...currentDetails, ...additionalDetails];
    } else if (newCount < currentDetails.length) {
      // 减少参与者
      newDetails = currentDetails.slice(0, newCount);
    } else {
      newDetails = currentDetails;
    }
    
    setBookingData(prev => ({
      ...prev,
      participantsCount: newCount,
      participantDetails: newDetails
    }));
  };

  // 更新参与者详情
  const updateParticipantDetail = (index, field, value) => {
    setBookingData(prev => ({
      ...prev,
      participantDetails: prev.participantDetails.map((detail, i) => 
        i === index ? { ...detail, [field]: value } : detail
      )
    }));
  };

  // 处理预订
  const handleBooking = async () => {
    if (!user.isLoggedIn) {
      navigate('/login');
      return;
    }
    const res = await request(
      'POST',
      `/travel/packages/${packageId}/book`,
      bookingData,
      setLoading
    );
    if (res.success) {
      alert(`预订成功！预订号: ${res.data.bookingNumber}`);
      navigate('/personal');
    } else {
      alert(res.message || '预订失败');
    }
  };

  // 格式化价格
  const formatPrice = (priceBreakdown) => {
    if (!priceBreakdown) return '价格面议';
    
    const { totalPrice = 0, currency = 'USD' } = priceBreakdown;
    return `${currency} ${totalPrice.toFixed(2)}`;
  };

  // 计算总价格
  const calculateTotalPrice = () => {
    if (!packageData || !packageData.priceBreakdown) return 0;
    
    const basePrice = packageData.priceBreakdown.totalPrice || 0;
    return basePrice * bookingData.participantsCount;
  };

  // 获取分类显示名称
  const getCategoryDisplayName = (category) => {
    const categoryMap = {
      'cultural': '文化之旅',
      'adventure': '冒险探索',
      'family': '亲子游',
      'romantic': '浪漫之旅',
      'business': '商务旅行',
      'leisure': '休闲度假'
    };
    return categoryMap[category] || category;
  };

  useEffect(() => {
    fetchPackageDetail();
  }, [packageId]);

  if (loading) {
    return (
      <div className="travel-package-detail loading">
        <div className="spinner"></div>
        <p>正在加载套餐详情...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="travel-package-detail error">
        <h2>加载失败</h2>
        <p>{error}</p>
        <button onClick={fetchPackageDetail}>重试</button>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="travel-package-detail not-found">
        <h2>套餐不存在</h2>
        <button onClick={() => navigate('/travel-packages')}>
          返回套餐列表
        </button>
      </div>
    );
  }

  return (
    <div className="travel-package-detail">
      {/* 头部图片和基本信息 */}
      <div className="package-header">
        <div className="images-section">
          {packageData.photos && packageData.photos.length > 0 ? (
            <>
              <div className="main-image">
                <img 
                  src={packageData.photos[selectedImageIndex]} 
                  alt={packageData.name} 
                />
              </div>
              {packageData.photos.length > 1 && (
                <div className="image-thumbnails">
                  {packageData.photos.map((photo, index) => (
                    <div 
                      key={index}
                      className={`thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <img src={photo} alt={`${packageData.name} ${index + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="placeholder-image">
              <span>📷</span>
              <p>暂无图片</p>
            </div>
          )}
        </div>

        <div className="package-summary">
          <div className="breadcrumb">
            <span onClick={() => navigate('/travel-packages')}>套餐列表</span>
            <span>›</span>
            <span>{packageData.name}</span>
          </div>
          
          <h1>{packageData.name}</h1>
          <div className="location">
            📍 {packageData.city}, {packageData.country}
          </div>
          
          <div className="quick-info">
            <div className="info-item">
              <span className="icon">⏰</span>
              <span>{packageData.durationDays}天{packageData.durationDays - 1}夜</span>
            </div>
            <div className="info-item">
              <span className="icon">👥</span>
              <span>{packageData.minParticipants}-{packageData.maxParticipants}人</span>
            </div>
            <div className="info-item">
              <span className="icon">🏷️</span>
              <span>{getCategoryDisplayName(packageData.category)}</span>
            </div>
            <div className="info-item">
              <span className="icon">📊</span>
              <span>{packageData.difficultyLevel === 'easy' ? '简单' : 
                     packageData.difficultyLevel === 'moderate' ? '中等' : '困难'}</span>
            </div>
          </div>

          <div className="rating-section">
            {packageData.rating ? (
              <div className="rating">
                <span className="stars">⭐</span>
                <span className="score">{packageData.rating.toFixed(1)}</span>
                <span className="reviews">({packageData.reviewsCount}条评价)</span>
              </div>
            ) : (
              <span className="no-rating">暂无评价</span>
            )}
          </div>

          <div className="price-section">
            <div className="price-main">
              <span className="price">{formatPrice(packageData.priceBreakdown)}</span>
              <span className="per-person">/人</span>
            </div>
            {packageData.featured && (
              <div className="featured-tag">热门推荐</div>
            )}
          </div>

          <button 
            className="book-now-btn"
            onClick={() => setShowBookingForm(true)}
          >
            立即预订
          </button>
        </div>
      </div>

      {/* 详细内容区 */}
      <div className="package-content">
        <div className="container">
          {/* 标签导航 */}
          <div className="tabs">
            <button 
              className={activeTab === 'itinerary' ? 'active' : ''}
              onClick={() => setActiveTab('itinerary')}
            >
              行程安排
            </button>
            <button 
              className={activeTab === 'details' ? 'active' : ''}
              onClick={() => setActiveTab('details')}
            >
              套餐详情
            </button>
            <button 
              className={activeTab === 'included' ? 'active' : ''}
              onClick={() => setActiveTab('included')}
            >
              费用说明
            </button>
            <button 
              className={activeTab === 'reviews' ? 'active' : ''}
              onClick={() => setActiveTab('reviews')}
            >
              客户评价
            </button>
          </div>

          {/* 标签内容 */}
          <div className="tab-content">
            {activeTab === 'itinerary' && (
              <div className="itinerary-content">
                <h3>详细行程</h3>
                {packageData.itinerary && packageData.itinerary.length > 0 ? (
                  <div className="itinerary-list">
                    {packageData.itinerary.map((day, index) => (
                      <div key={index} className="day-item">
                        <div className="day-header">
                          <div className="day-number">第{day.day}天</div>
                          <h4>{day.title}</h4>
                        </div>
                        
                        {day.description && (
                          <p className="day-description">{day.description}</p>
                        )}
                        
                        {day.attractions && day.attractions.length > 0 && (
                          <div className="day-attractions">
                            <h5>景点安排</h5>
                            <div className="attractions-grid">
                              {day.attractions.map((attraction, idx) => (
                                <div key={idx} className="attraction-item">
                                  <h6>{attraction.name}</h6>
                                  <p>{attraction.address}</p>
                                  {attraction.rating && (
                                    <div className="attraction-rating">
                                      ⭐ {attraction.rating}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {day.restaurants && day.restaurants.length > 0 && (
                          <div className="day-restaurants">
                            <h5>餐厅推荐</h5>
                            <div className="restaurants-grid">
                              {day.restaurants.map((restaurant, idx) => (
                                <div key={idx} className="restaurant-item">
                                  <h6>{restaurant.name}</h6>
                                  <p>{restaurant.address}</p>
                                  {restaurant.cuisineType && (
                                    <span className="cuisine-type">{restaurant.cuisineType}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {day.travelTips && (
                          <div className="travel-tips">
                            <h5>旅行贴士</h5>
                            <p>{day.travelTips}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>暂无详细行程安排</p>
                )}
              </div>
            )}

            {activeTab === 'details' && (
              <div className="details-content">
                <h3>套餐详情</h3>
                <div className="description">
                  <p>{packageData.description}</p>
                </div>
                
                {packageData.weatherInfo && (
                  <div className="weather-info">
                    <h4>天气信息</h4>
                    <div className="weather-grid">
                      {packageData.weatherInfo.temperatureAvg && (
                        <div className="weather-item">
                          <span className="label">平均温度:</span>
                          <span>{packageData.weatherInfo.temperatureAvg}°C</span>
                        </div>
                      )}
                      {packageData.weatherInfo.bestVisitMonths && (
                        <div className="weather-item">
                          <span className="label">最佳旅游时间:</span>
                          <span>{packageData.weatherInfo.bestVisitMonths.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'included' && (
              <div className="included-content">
                <h3>费用说明</h3>
                
                {packageData.priceBreakdown && (
                  <div className="price-breakdown">
                    <h4>价格明细</h4>
                    <div className="price-items">
                      <div className="price-item">
                        <span>基础费用:</span>
                        <span>${packageData.priceBreakdown.basePrice || 0}</span>
                      </div>
                      {packageData.priceBreakdown.hotelCost && (
                        <div className="price-item">
                          <span>住宿费用:</span>
                          <span>${packageData.priceBreakdown.hotelCost}</span>
                        </div>
                      )}
                      {packageData.priceBreakdown.mealCost && (
                        <div className="price-item">
                          <span>餐饮费用:</span>
                          <span>${packageData.priceBreakdown.mealCost}</span>
                        </div>
                      )}
                      {packageData.priceBreakdown.serviceFee && (
                        <div className="price-item">
                          <span>服务费:</span>
                          <span>${packageData.priceBreakdown.serviceFee}</span>
                        </div>
                      )}
                      <div className="price-item total">
                        <span>总计:</span>
                        <span>${packageData.priceBreakdown.totalPrice || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {packageData.includedServices && packageData.includedServices.length > 0 && (
                  <div className="services-section">
                    <h4>费用包含</h4>
                    <ul className="services-list included">
                      {packageData.includedServices.map((service, index) => (
                        <li key={index}>✅ {service}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {packageData.excludedServices && packageData.excludedServices.length > 0 && (
                  <div className="services-section">
                    <h4>费用不含</h4>
                    <ul className="services-list excluded">
                      {packageData.excludedServices.map((service, index) => (
                        <li key={index}>❌ {service}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="reviews-content">
                <h3>客户评价</h3>
                <div className="reviews-placeholder">
                  <p>评价功能即将上线，敬请期待！</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 预订表单模态框 */}
      {showBookingForm && (
        <div className="booking-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>预订 {packageData.name}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowBookingForm(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="booking-summary">
                <h4>预订信息</h4>
                <div className="summary-item">
                  <span>套餐名称:</span>
                  <span>{packageData.name}</span>
                </div>
                <div className="summary-item">
                  <span>目的地:</span>
                  <span>{packageData.city}, {packageData.country}</span>
                </div>
                <div className="summary-item">
                  <span>行程天数:</span>
                  <span>{packageData.durationDays}天{packageData.durationDays - 1}夜</span>
                </div>
              </div>

              <div className="booking-form">
                <div className="form-group">
                  <label>参与人数</label>
                  <div className="participants-control">
                    <button 
                      type="button"
                      onClick={() => updateParticipantsCount(bookingData.participantsCount - 1)}
                      disabled={bookingData.participantsCount <= packageData.minParticipants}
                    >
                      -
                    </button>
                    <span>{bookingData.participantsCount}</span>
                    <button 
                      type="button"
                      onClick={() => updateParticipantsCount(bookingData.participantsCount + 1)}
                      disabled={bookingData.participantsCount >= packageData.maxParticipants}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>出发日期</label>
                  <input
                    type="date"
                    value={bookingData.travelDate}
                    onChange={(e) => setBookingData(prev => ({
                      ...prev,
                      travelDate: e.target.value
                    }))}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>联系邮箱</label>
                  <input
                    type="email"
                    value={bookingData.contactEmail}
                    onChange={(e) => setBookingData(prev => ({
                      ...prev,
                      contactEmail: e.target.value
                    }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>联系电话</label>
                  <input
                    type="tel"
                    value={bookingData.contactPhone}
                    onChange={(e) => setBookingData(prev => ({
                      ...prev,
                      contactPhone: e.target.value
                    }))}
                  />
                </div>

                <div className="form-group">
                  <label>特殊要求</label>
                  <textarea
                    value={bookingData.specialRequests}
                    onChange={(e) => setBookingData(prev => ({
                      ...prev,
                      specialRequests: e.target.value
                    }))}
                    placeholder="请输入特殊要求或备注信息"
                  />
                </div>

                <div className="participants-details">
                  <h4>参与者信息</h4>
                  {bookingData.participantDetails.map((participant, index) => (
                    <div key={index} className="participant-form">
                      <h5>参与者 {index + 1}</h5>
                      <div className="form-row">
                        <input
                          type="text"
                          placeholder="姓名"
                          value={participant.name}
                          onChange={(e) => updateParticipantDetail(index, 'name', e.target.value)}
                          required
                        />
                        <input
                          type="email"
                          placeholder="邮箱"
                          value={participant.email}
                          onChange={(e) => updateParticipantDetail(index, 'email', e.target.value)}
                        />
                      </div>
                      <div className="form-row">
                        <input
                          type="tel"
                          placeholder="电话"
                          value={participant.phone}
                          onChange={(e) => updateParticipantDetail(index, 'phone', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="护照号码"
                          value={participant.passportNumber}
                          onChange={(e) => updateParticipantDetail(index, 'passportNumber', e.target.value)}
                        />
                      </div>
                      <input
                        type="date"
                        placeholder="出生日期"
                        value={participant.birthDate}
                        onChange={(e) => updateParticipantDetail(index, 'birthDate', e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="price-summary">
                  <div className="price-calculation">
                    <span>单价: {formatPrice(packageData.priceBreakdown)}</span>
                    <span>人数: {bookingData.participantsCount}</span>
                  </div>
                  <div className="total-price">
                    总计: {packageData.priceBreakdown?.currency || 'USD'} {calculateTotalPrice().toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowBookingForm(false)}
              >
                取消
              </button>
              <button 
                className="confirm-btn"
                onClick={handleBooking}
              >
                确认预订
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelPackageDetail;