import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'  
import { restoreDraftOrders, clearDraftHotelOrder } from '@/redux/slices/orderSlice' 
import Navbar from '@/components/Navbar'
import { format } from "date-fns"
import "./order.scss"
import Skeleton from 'react-loading-skeleton'
import { MdFreeBreakfast } from "react-icons/md"
import { toast } from 'react-toastify'
import { request } from '@/utils/api/service'

const Order = () => {
  const navigate = useRouter(); 
  const dispatch = useDispatch();
  const { draftHotelOrder } = useSelector(state => state.order);
  const { userInfo } = useSelector(state => state.user);
  
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [savedOrderInfo, setSavedOrderInfo] = useState(null); // 保存订单信息用于成功页面展示
  const [isRestoring, setIsRestoring] = useState(true); // 标记是否正在恢复草稿订单


  useEffect(() => {
    const restoreData = async () => {
      dispatch(restoreDraftOrders());
      // 给一个短暂的延迟确保Redux状态更新完成
      setTimeout(() => {
        setIsRestoring(false);
      }, 50);
    };
    restoreData();
  }, [dispatch]);


  useEffect(() => {
    if (isRestoring) {
      console.log('正在恢复草稿订单，等待完成...');
      return;
    }
    
    if (orderSuccess) {
      console.log('订单已成功，跳过检查');
      return;
    }
    
    if (!draftHotelOrder) {
      console.warn('没有找到草稿订单，重定向到酒店列表');
      toast.error('订单信息已过期，请重新选择房间');
      navigate.push('/hotels');
      return;
    }
    
    if (draftHotelOrder.expiresAt) {
      const expirationTime = new Date(draftHotelOrder.expiresAt);
      const currentTime = new Date();
      
      if (expirationTime <= currentTime) {
        console.warn('草稿订单已过期');
        dispatch(clearDraftHotelOrder());
        toast.error('订单已过期，请重新选择房间');
        navigate.push('/hotels');
        return;
      } else {
        console.log('草稿订单未过期，继续');
      }
    } else {
      console.log('无过期时间设置');
    }
  }, [draftHotelOrder, dispatch, navigate, orderSuccess, isRestoring]);

  const handleOrder = async () => {
    if (!draftHotelOrder) {
      toast.error('订单信息丢失，请重新选择房间');
      navigate.push('/hotels');
      return;
    }
    
    const { hotelData, roomData, checkInDate, checkOutDate } = draftHotelOrder;
    
    if (!roomData || !roomData.roomTotalPrice || roomData.roomTotalPrice <= 0) {
      toast.error('房间价格信息错误，请联系客服');
      return;
    }
    
    if (!selectedPaymentType) {
      toast.error('请选择付款方式');
      return;
    }

    const orderData = {
      hotelId: hotelData.id,
      roomId: roomData.id,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      totalPrice: roomData.roomTotalPrice,
      payment: {
        method: selectedPaymentType
      }
    };

    const result = await request('POST', '/order', orderData);

    if (result.success) {
      // 在清除草稿订单前，保存订单信息用于成功页面显示
      setSavedOrderInfo({
        hotelData,
        roomData,
        checkInDate,
        checkOutDate
      });
      setOrderSuccess(true);
      setOrderData(result.data);
      toast.success('订单创建成功！');
      setTimeout(() => {
        dispatch(clearDraftHotelOrder());
      }, 100);
    } else {
      console.error('订单提交失败:', result);
      toast.error(`订单提交失败: ${result.message || '未知错误'}`);
    }
  }


  const OrderSkeleton = () => (
    <div className='order'>
      <Navbar />
      <div className="order-container">
        <div className="order-wrapper">
          <Skeleton height={50} className="mb-4" />
          <div className="hotel-info">
            <Skeleton height={40} width={300} className="mb-2" />
            <Skeleton height={20} width={200} className="mb-2" />
            <Skeleton height={30} width={60} />
          </div>
          <div className="booking-info">
            <Skeleton height={30} width={150} className="mb-3" />
            <div className="dates">
              <Skeleton height={100} width="45%" className="mr-4" />
              <Skeleton height={100} width="45%" />
            </div>
            <Skeleton height={80} className="mt-3" />
          </div>
          <div className="price-details">
            <Skeleton height={30} width={150} className="mb-3" />
            <Skeleton height={50} />
          </div>
        </div>
      </div>
    </div>
  )
  
  if (isRestoring || (!draftHotelOrder && !orderSuccess)) return <OrderSkeleton />

  const displayData = savedOrderInfo || draftHotelOrder;
  const { hotelData, roomData, checkInDate, checkOutDate } = displayData || {};
  
  if (!displayData) return <OrderSkeleton />

  // 安全的日期格式
  const formatSafeDate = (dateValue, formatPattern) => {
    if (!dateValue) return '日期未设置';
    
    try {
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      if (isNaN(date.getTime())) {
        return '日期格式错误';
      }
      return format(date, formatPattern);
    } catch (error) {
      console.error('日期格式化错误:', error);
      return '日期格式错误';
    }
  };

  return (
    <div className='order'>
      <Navbar />
      <div className="order-container">
        <div className="order-wrapper">
          <div className="progress-step">
            <div className="step-item active">
              <div className="step-number">1</div>
              <div className="step-text">選擇房型</div>
            </div>
            <div className="step-item active">
              <div className="step-number">2</div>
              <div className="step-text">填寫資料</div>
            </div>
            <div className={`step-item ${orderSuccess ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-text">完成預訂</div>
            </div>
          </div>

          {orderSuccess ? (
            <div className="order-success">
              <div className="success-icon">✓</div>
              <h2>訂房成功！</h2>
              <p>感謝您的預訂，我們已收到您的訂單。</p>
              <div className="booking-summary">
                <h3>訂單摘要</h3>
                <div className="summary-item">
                  <span>飯店名稱：</span>
                  <span>{hotelData.name}</span>
                </div>
                <div className="summary-item">
                  <span>房型：</span>
                  <span>{roomData.title}</span>
                </div>
                <div className="summary-item">
                  <span>入住日期：</span>
                  <span>{formatSafeDate(checkInDate, "yyyy 年 MM 月 dd 日")}</span>
                </div>
                <div className="summary-item">
                  <span>退房日期：</span>
                  <span>{formatSafeDate(checkOutDate, "yyyy 年 MM 月 dd 日")}</span>
                </div>
                <div className="summary-item">
                  <span>總金額：</span>
                  <span>TWD {orderData?.totalPrice ?? roomData.roomTotalPrice}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="order-content">
              <div className="hotel-info">
                <div className="hotel-name">{hotelData.name}</div>
                <p className="address">{hotelData.address}</p>
                <div className="inform">
                  <span className="inform-item">Email: {hotelData.email}</span>
                  <span className="inform-item">Tel: {hotelData.phone}</span>
                </div>
              </div>

              <div className="customer-info">
                <h3>訂房人資訊</h3>
                {(() => {
                  return (
                    <div className="customer-details">
                      <div className="info-item">
                        <span className="label">姓名：</span>
                        <span>{userInfo?.realName ?? userInfo?.real_name ?? ''}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">帳號：</span>
                        <span>{userInfo?.username ?? ''}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">電話：</span>
                        <span>{userInfo?.phoneNumber ?? userInfo?.phone_number ?? ''}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">地址：</span>
                        <span>{userInfo?.address ?? ''}</span>
                      </div>
                    </div>
                  )
                })()}
              </div>

              <div className="booking-info">
                <h3>您的訂房資訊</h3>
                <div className="dates">
                  <div className="check-in">
                    <h4>入住時間</h4>
                    <p>{formatSafeDate(checkInDate, "yyyy 年 MM 月 dd 日")}</p>
                    <p>下午3:00 - 下午6:00</p>
                  </div>
                  <div className="check-out">
                    <h4>退房時間</h4>
                    <p>{formatSafeDate(checkOutDate, "yyyy 年 MM 月 dd 日")}</p>
                    <p>上午11:00前</p>
                  </div>
                </div>
                <div className="room-details">
                  <div className="room-title">已選擇：</div>
                  <div className="room-info">
                    <div className="room-people">
                      {roomData.title} ({roomData.maxPeople} 位成人)
                    </div>
                    {roomData.breakFast && (
                      <div className="breakfast-info">
                        <MdFreeBreakfast className="breakfast-icon" />
                        <span>含早餐</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="price-details">
                <div className="price-title">房價明細</div>
                <div className="total-price">
                  <div className="booking-policies">
                    {roomData.paymentOptions.map((policy, idx) => (
                      <div
                        key={policy.type || idx}
                        className={`policy-item ${selectedPaymentType === policy.type ? 'selected' : ''}`}
                        onClick={() => setSelectedPaymentType(policy.type)}
                      >
                        <div className="policy-type">支付方式：{policy.type}</div>
                        <div className="policy-description">{policy.description}</div>
                        <div className="policy-refund">
                          {policy?.refundable ? '可退款' : '不可退款'}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="price-summary">
                    <span>總金額</span>
                    <span className="price">TWD {roomData.roomTotalPrice}</span>
                  </div>
                </div>
                <button
                  className="confirm-button"
                  disabled={!selectedPaymentType}
                  onClick={handleOrder}
                >
                  確認訂單
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  )
}

export default Order