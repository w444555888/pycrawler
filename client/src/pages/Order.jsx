import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { format } from "date-fns"
import "./order.scss"
import Skeleton from 'react-loading-skeleton'
import { MdFreeBreakfast } from "react-icons/md"
import { toast } from 'react-toastify'
import { request } from '../utils/apiService'
const Order = () => {
  const { startDate, endDate, hotelId, roomId } = useParams();
  const { currentHotel, availableRooms } = useSelector(state => state.hotel);
  const { userInfo } = useSelector(state => state.user);
  const [selectedRoom, setSelectedRoom] = useState(null);
  // 付款方式
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderData, setOrderData] = useState(null);

  const handleOrder = async () => {
    const result = await request('POST', '/order', {
      hotelId: hotelId,
      roomId: roomId,
      checkInDate: startDate,
      checkOutDate: endDate,
      totalPrice: selectedRoom.roomTotalPrice,
      payment: {
        method: selectedPaymentType
      }
    })

    if (result.success) {
      setOrderSuccess(true);
      setOrderData(result.data);
      toast.success('訂單新增成功！');
    } else toast.error(`${result.message}`);
  }

  useEffect(() => {
    if (availableRooms && roomId) {
      const room = availableRooms.find(room => room._id === roomId)
      setSelectedRoom(room);
    }
  }, [availableRooms, roomId])

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

  if (!currentHotel || !selectedRoom) return <OrderSkeleton />

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
                  <span>{currentHotel.name}</span>
                </div>
                <div className="summary-item">
                  <span>房型：</span>
                  <span>{selectedRoom.title}</span>
                </div>
                <div className="summary-item">
                  <span>入住日期：</span>
                  <span>{format(new Date(startDate), "yyyy 年 MM 月 dd 日")}</span>
                </div>
                <div className="summary-item">
                  <span>退房日期：</span>
                  <span>{format(new Date(endDate), "yyyy 年 MM 月 dd 日")}</span>
                </div>
                <div className="summary-item">
                  <span>總金額：</span>
                  <span>TWD {orderData?.totalPrice ?? selectedRoom.roomTotalPrice}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="order-content">
              <div className="hotel-info">
                <div className="hotel-name">{currentHotel.name}</div>
                <p className="address">{currentHotel.address}</p>
                <div className="inform">
                  <span className="inform-item">Email: {currentHotel.email}</span>
                  <span className="inform-item">Tel: {currentHotel.phone}</span>
                </div>
              </div>

              <div className="customer-info">
                <h3>訂房人資訊</h3>
                {(() => {
                  return (
                    <div className="customer-details">
                      <div className="info-item">
                        <span className="label">姓名：</span>
                        <span>{userInfo?.realName ?? ''}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">帳號：</span>
                        <span>{userInfo?.username ?? ''}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">電話：</span>
                        <span>{userInfo?.phoneNumber ?? ''}</span>
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
                    <p>{format(new Date(startDate), "yyyy 年 MM 月 dd 日")}</p>
                    <p>下午3:00 - 下午6:00</p>
                  </div>
                  <div className="check-out">
                    <h4>退房時間</h4>
                    <p>{format(new Date(endDate), "yyyy 年 MM 月 dd 日")}</p>
                    <p>上午11:00前</p>
                  </div>
                </div>
                <div className="room-details">
                  <div className="room-title">已選擇：</div>
                  <div className="room-info">
                    <div className="room-people">
                      {selectedRoom.title} ({selectedRoom.maxPeople} 位成人)
                    </div>
                    {selectedRoom.breakFast && (
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
                    {selectedRoom.paymentOptions.map(policy => (
                      <div
                        key={policy._id}
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
                    <span className="price">TWD {selectedRoom.roomTotalPrice}</span>
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