import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faPhone, faLink, faStar, faTag } from '@fortawesome/free-solid-svg-icons';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import EmptyState from '../subcomponents/EmptyState';
import { useRouter } from 'next/navigation';
import { request } from '@/utils/api/service';
import './travelPackageList.scss';

const TravelPackageList = () => {
  const navigate = useRouter();
  
  // State 管理
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ city: '' });
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    hasMore: true
  });

  // 获取列表数据
  const fetchPackages = async (isLoadMore = false) => {
    setLoading(true);
    const params = {};
    if (filters.city) params.city = filters.city;
    params.limit = pagination.limit;
    params.offset = isLoadMore ? pagination.offset : 0;
    const res = await request('GET', '/travel/packages', params, setLoading);
    if (res.success) {
      const data = res.data || {};
      const newPackages = data.packages || [];
      if (isLoadMore) {
        setPackages(prev => [...prev, ...newPackages]);
      } else {
        setPackages(newPackages);
      }
      setPagination(prev => ({
        ...prev,
        offset: isLoadMore ? prev.offset + prev.limit : prev.limit,
        hasMore: newPackages.length === prev.limit
      }));

      console.log('pagination:', pagination);
      
      setError(null);
    } else {
      setError(res.message || '獲取景點失敗');
    }
    setLoading(false);
  };


  const handleCityChange = (value) => {
    setFilters({ city: value });
  };



  const handleLoadMore = () => {
    if (!loading && pagination.hasMore) {
      fetchPackages(true);
    }
  };


  const handlePackageClick = (pkg) => {
    navigate.push(`/travel-packages/${pkg.fsq_place_id}`);
  };

  const formatCategories = (categories = []) => {
    if (!categories.length) return '';
    return categories.map(cat => cat.short_name || cat.name).join('、');
  };

  const formatDistance = (distance) => {
    if (!distance && distance !== 0) return '';
    if (distance >= 1000) return `${(distance / 1000).toFixed(1)} km`;
    return `${distance} m`;
  };

  return (
    <div className="travel-package-list">
      {/* 头部 */}
      <div className="page-header">
        <div className="container">
          <p className='title'>探索景點套餐</p>
          <p className='subtitle'>MIKEY 探索景點套餐</p>
        </div>
      </div>

      <div className="container">
        <div className="content-wrapper">
          {/* 侧边栏筛选 */}
          <div className="sidebar">
            <div className="filter-section">
              <p className='search-title'>目的地搜索</p>
              <div className="filter-group">
                <input
                  type="text"
                  placeholder="輸入城市名稱"
                  value={filters.city}
                  onChange={(e) => handleCityChange(e.target.value)}
                />
              </div>
              <button
                className="search-btn"
                onClick={() => {
                  setPagination(prev => ({ ...prev, offset: 0, hasMore: true }));
                  fetchPackages(false);
                }}
                disabled={loading || !filters.city}
              >
                搜索
              </button>
              <button
                className="clear-filters-btn"
                onClick={() => {
                  setFilters({ city: '' });
                  setPagination(prev => ({ ...prev, offset: 0, hasMore: true }));
                  fetchPackages(false);
                }}
                disabled={loading && !filters.city}
              >
                清空
              </button>
            </div>
          </div>


          {/* 主内容区 */}
          <div className="main-content">
            <div className="results-header">
              <span>共找到 {packages.length} 個景點</span>
            </div>

            {/* 错误状态 */}
            {error && (
              <div className="error-state">
                <p>{error}</p>
                <button onClick={() => fetchPackages()}>重试</button>
              </div>
            )}

            {/* 景點列表 */}
            <div className="packages-grid">
              {packages.map(pkg => (
                <div
                  key={pkg.fsq_place_id || pkg.id}
                  className="package-card"
                  onClick={() => handlePackageClick(pkg)}
                >
                  {/* 景點圖片/分類icon */}
                  <div className="package-image">
                    {pkg.photos && pkg.photos.length > 0 ? (
                      <img src={pkg.photos[0]} alt={pkg.name} />
                    ) : (
                      <div className="placeholder-image">
                        <FontAwesomeIcon icon={faTag} className="placeholder-icon" />
                      </div>
                    )}
                  </div>

                  {/* 景點信息 */}
                  <div className="package-info">
                    <div className="package-location">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="location-icon" />
                      {pkg.location?.formatted_address || pkg.address || '-'}
                      {pkg.distance !== undefined && (
                        <span className="distance-text">
                          {formatDistance(pkg.distance)}
                        </span>
                      )}
                    </div>

                    <p className="package-title">{pkg.name}</p>

                    <div className="package-details">
                      {pkg.categories && pkg.categories.length > 0 && (
                        <div className="detail-item">
                          <span className="icon"><FontAwesomeIcon icon={faTag} /></span>
                          <span>{formatCategories(pkg.categories)}</span>
                        </div>
                      )}
                      {pkg.tel || pkg.phone ? (
                        <div className="detail-item">
                          <span className="icon"><FontAwesomeIcon icon={faPhone} /></span>
                          <span>{pkg.tel || pkg.phone}</span>
                        </div>
                      ) : null}
                      {pkg.website && (
                        <div className="detail-item">
                          <span className="icon"><FontAwesomeIcon icon={faLink} /></span>
                          <a href={pkg.website} target="_blank" rel="noopener noreferrer">官網</a>
                        </div>
                      )}
                    </div>

                    <p className="package-description">
                      {pkg.description || '暫無簡介'}
                    </p>

                    <div className="package-footer">
                      <div className="package-rating">
                        {pkg.rating ? (
                          <>
                            <span className="stars"><FontAwesomeIcon icon={faStar} className="star-icon" /></span>
                            <span>{pkg.rating.toFixed(1)}</span>
                          </>
                        ) : (
                          <span className="no-rating">暫無評分</span>
                        )}
                      </div>
                      <div className="package-price">
                        {pkg.price_level ? `¥${pkg.price_level}` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 骨架屏 */}
            {loading && (
              <div className="skeleton-list">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div className="package-card skeleton-card" key={idx}>
                    <div className="package-image">
                      <Skeleton height={200} borderRadius={12} />
                    </div>
                    <div className="package-info">
                      <div className="package-location">
                        <Skeleton width={120} height={18} />
                      </div>
                      <p className="package-title">
                        <Skeleton width={140} height={22} />
                      </p>
                      <div className="package-details">
                        <div className="detail-item">
                          <Skeleton width={80} height={16} />
                        </div>
                        <div className="detail-item">
                          <Skeleton width={60} height={16} />
                        </div>
                      </div>
                      <p className="package-description">
                        <Skeleton count={2} height={14} style={{ marginBottom: 4 }} />
                      </p>
                      <div className="package-footer">
                        <div className="package-rating">
                          <Skeleton width={40} height={18} />
                        </div>
                        <div className="package-price">
                          <Skeleton width={50} height={18} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 加载更多按钮 */}
            {!loading && pagination.hasMore && packages.length > 0 && (
              <div className="load-more">
                <button onClick={handleLoadMore}>
                  加载更多景點
                </button>
              </div>
            )}

            {/* 空状态 */}
            {!loading && packages.length === 0 && !error && (
              <EmptyState
                icon="search"
                title="無符合景點"
                description="請嘗試更改搜索條件或稍後再試。"
                actionText={null}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelPackageList;