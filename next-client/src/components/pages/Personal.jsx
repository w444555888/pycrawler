
import React, { useState, useEffect, useReducer } from 'react'
import { useRouter } from 'next/navigation'
import './personal.scss'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleRight } from '@fortawesome/free-solid-svg-icons'
import { useDispatch, useSelector } from 'react-redux'
import { logOut, setUserInfo } from '@/redux/slices/userSlice'
import { fetchUserOrders } from '@/redux/slices/orderSlice'
import { persistor } from '@/redux/store/store'
import { request } from '@/utils/api/service'
import dayjs from '@/utils/dayjs-config'
import { toast } from 'react-toastify'
import EmptyState from '../subcomponents/EmptyState'

// reducer
const formReducer = (state, action) => {
  switch (action.type) {
    case 'INIT_FORM':
      return {
        ...state,
        real_name: action.payload.real_name || action.payload.realName || '',
        phone_number: action.payload.phone_number || action.payload.phoneNumber || '',
        address: action.payload.address || '',
        username: action.payload.username || '',
        email: action.payload.email || ''
      }
    case 'UPDATE_FIELD':
      return {
        ...state,
        [action.field]: action.value
      }
    case 'RESET_FORM':
      return action.payload
    default:
      return state
  }
}

const Personal = () => {
  const dispatch = useDispatch()
  const navigate = useRouter()
  const { userInfo } = useSelector(state => state.user);
  const { orders = [], flightOrders = [], flashSaleOrders = [], loading: orderLoading } = useSelector(state => state.order);
  
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [formData, dispatchForm] = useReducer(formReducer, {
    real_name: '',
    phone_number: '',
    address: '',
    username: '',
    email: ''
  })
  
  useEffect(() => {
    if (userInfo) {
      dispatchForm({
        type: 'INIT_FORM',
        payload: userInfo
      })
    }
  }, [userInfo])


  const handleClickToHome = () => {
    navigate.push('/')
  }

  
  const handleEdit = async (e) => {
    e.preventDefault()
    if (!userInfo || !userInfo.id) {
      toast.error('用戶信息未加載，請稍後再試');
      return;
    }
    
    const result = await request('PUT', `/users/${userInfo.id}`, { 
      password: password, 
      realName: formData.real_name,
      phoneNumber: formData.phone_number,
      address: formData.address 
    }, setLoading)
    if (result.success) {
      const userData = result.data?.user || result.data;
      dispatch(setUserInfo(userData));
      toast.success('編輯帳戶成功！');
    } else toast.error(`${result.message}`)
  }


  const handleClicklogOut = async () => {
    await request('POST', '/auth/logout')
    dispatch(logOut())
    persistor.purge()
    toast.success('已成功登出')
    navigate.push('/login')
  }

  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userInfo || !userInfo.id) {
        return;
      }
      
      dispatch(fetchUserOrders(userInfo.id));
    };
    fetchUserData();
  }, [userInfo?.id, dispatch])

  return (
    <div className="personalWrapper">
      <div className="personalContainer">
        <div className="personalTitle">
          <div className="left">
            <span className="logo">MIKE.BOOKING</span>
          </div>
          <div className="right">
            <div className="navButton" onClick={handleClickToHome}>
              <FontAwesomeIcon icon={faCircleRight} />
            </div>
          </div>
        </div>
      </div>
      <div className="personalContainer">
        <h2>Personalize</h2>
        <form >
          <div className="formGroup">
            <label htmlFor="email">E-mail:</label>
            <input type="email" id="email" value={formData.email} required disabled />
          </div>
          <div className="formGroup">
            <label htmlFor="username">Username:</label>
            <input id="username" value={formData.username} required disabled />
          </div>
          <div className="formGroup">
            <label htmlFor="password">Change Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="formGroup">
            <label htmlFor="realName">Real Name:</label>
            <input
              type="text"
              id="realName"
              value={formData.real_name}
              onChange={(e) => dispatchForm({
                type: 'UPDATE_FIELD',
                field: 'real_name',
                value: e.target.value
              })}
              required
            />
          </div>
          <div className="formGroup">
            <label htmlFor="phoneNumber">Phone Number:</label>
            <input
              id="phoneNumber"
              value={formData.phone_number}
              onChange={(e) => dispatchForm({
                type: 'UPDATE_FIELD',
                field: 'phone_number',
                value: e.target.value
              })}
              required
            />
          </div>
          <div className="formGroup">
            <label htmlFor="address">Address:</label>
            <input
              id="address"
              value={formData.address}
              onChange={(e) => dispatchForm({
                type: 'UPDATE_FIELD',
                field: 'address',
                value: e.target.value
              })}
              required
            />
          </div>
          <button type='submit' onClick={handleEdit}>Confirm Edit</button>
          <button onClick={handleClicklogOut} >Log Out</button>
        </form>

      </div>
      <div className="personalContainer">
        <h2>My Hotel Bookings</h2>
        <div className="orderList">
          {(orders?.length || 0) === 0 ? (
            <EmptyState title="無訂房訂單" />
          ) : (
            orders.map((order) => (
              <div key={order.id} className="orderItem">
                <div className="orderHeader">
                  <span>訂單編號: {order.id}</span>
                  <span>狀態: {
                    order.status === 'pending' ? '支付中' :
                      order.status === 'confirmed' ? '已確認' :
                        order.status === 'cancelled' ? '已取消' :
                          order.status === 'completed' ? '已完成' :
                            ''
                  }</span>
                </div>
                <div className="orderDetails">
                  <p>入住日期: {dayjs(order.check_in_date).format('YYYY-MM-DD')}</p>
                  <p>退房日期: {dayjs(order.check_out_date).format('YYYY-MM-DD')}</p>
                  <p>總價: ${order.total_price}</p>
                  <p>支付方式: {
                    order.payment.method === 'credit_card' ? '信用卡' :
                      order.payment.method === 'paypal' ? 'PayPal' :
                        order.payment.method === 'bank_transfer' ? '銀行轉帳' :
                          order.payment.method === 'on_site_payment' ? '現場支付' :
                            ''
                  }</p>

                  <p>支付狀態: {
                    order.payment.status === 'pending' ? '支付中' :
                      order.payment.status === 'paid' ? '已支付' :
                        order.payment.status === 'failed' ? '支付失敗' :
                          order.payment.status === 'refunded' ? '已退款' :
                            ''
                  }</p>

                </div>
              </div>
            )))
          }
        </div>
      </div>
      <div className="personalContainer">
        <h2>My Flight Orders</h2>
        <div className="orderList">
          {(flightOrders?.length || 0) === 0 ? (
            <EmptyState title="無航班訂單" />
          ) : (
            flightOrders.map((order) => {
              const departureTime = order.flightInfo?.departureTime
                ? dayjs(order.flightInfo.departureTime).format('YYYY-MM-DD HH:mm')
                : '未知';
              const arrivalTime = order.flightInfo?.arrivalTime
                ? dayjs(order.flightInfo.arrivalTime).format('YYYY-MM-DD HH:mm')
                : '未知';

              return (
                <div key={order.id} className="orderItem">
                  <div className="orderHeader">
                    <span>訂單編號: {order.orderNumber}</span>
                    <span>
                      狀態: {
                        order.status === 'PENDING' ? '待處理' :
                          order.status === 'CONFIRMED' ? '已確認' :
                            order.status === 'CANCELLED' ? '已取消' :
                              order.status === 'COMPLETED' ? '已完成' : '未知'
                      }
                    </span>
                  </div>
                  <div className="orderDetails">
                    <p>
                      <span>航班信息</span>
                      <span>{order.flightInfo?.airline} {order.flightInfo?.flightNumber}</span>
                    </p>
                    <p>
                      <span>航線</span>
                      <span>{order.flightInfo?.departureAirport} → {order.flightInfo?.arrivalAirport}</span>
                    </p>
                    <p>
                      <span>出發時間</span>
                      <span>{departureTime}</span>
                    </p>
                    <p>
                      <span>抵達時間</span>
                      <span>{arrivalTime}</span>
                    </p>
                    <p>
                      <span>艙等</span>
                      <span>{
                        order.category === 'ECONOMY' ? '經濟艙' :
                          order.category === 'BUSINESS' ? '商務艙' :
                            order.category === 'FIRST' ? '頭等艙' : '未知'
                      }</span>
                    </p>
                    <p>
                      <span>基本票價</span>
                      <span>${order.price?.basePrice}</span>
                    </p>
                    <p>
                      <span>稅金</span>
                      <span>${order.price?.tax}</span>
                    </p>
                    <p>
                      <span>總價</span>
                      <span>${order.price?.totalPrice}</span>
                    </p>

                    <div className="passengerInfo">
                      <p>乘客資訊</p>
                      {order.passengerInfo.map((passenger, index) => (
                        <div key={passenger.id || index} className="passenger">
                          <p>乘客 {index + 1}</p>
                          <p data-label="姓名">{passenger.name}</p>
                          <p data-label="性別">{passenger.gender === 1 ? '男' : '女'}</p>
                          <p data-label="出生年月日">{dayjs(passenger.birthDate).format('YYYY-MM-DD')}</p>
                          <p data-label="護照號碼">{passenger.passportNumber}</p>
                          <p data-label="E-mail">{passenger.email}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
      <div className="personalContainer">
        <h2>My Flash Sale Bookings</h2>
        <div className="orderList">
          {(flashSaleOrders?.length || 0) === 0 ? (
            <EmptyState title="無搶購訂房活動訂單" />
          ) : (
            flashSaleOrders.map((order) => (
              <div key={order.id} className="orderItem">
                <div className="orderHeader">
                  <span>訂單編號: {order.id}</span>
                  <span>狀態: {
                    order.status === 'booked' ? '已訂購' :
                      order.status === 'cancelled' ? '已取消' : '未知'
                  }</span>
                </div>
                <div className="orderDetails">
                  <p>飯店: {order.hotelName}</p>
                  <p>房型: {order.roomTitle}</p>
                  <p>活動名稱: {order.saleTitle}</p>
                  <p>日期: {dayjs(order.date).format('YYYY-MM-DD')}</p>
                  <p>原價: ${order.basePrice}</p>
                  <p>折扣: {order.discountRate * 100}%</p>
                  <p>折扣後價格: ${order.finalPrice}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}

export default Personal
