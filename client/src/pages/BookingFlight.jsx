import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'  
import { restoreSelectedFlight } from '../redux/flightStore'
import Navbar from '../components/Navbar'
import './bookingFlight.scss'
import { request } from '../utils/apiService'
import dayjs from '../utils/dayjs-config'
import formatDuration from '../utils/formatDuration';
import gsap from 'gsap';
import { toast } from 'react-toastify'
import Skeleton from 'react-loading-skeleton'

const BookingFlight = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const dispatch = useDispatch()  

    const { selectedFlight } = useSelector(state => state.flight)
    const [loading, setLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [flightData, setFlightData] = useState(null);
    const [passengers, setPassengers] = useState([{ name: '', gender: '', birthDate: '', passportNumber: '', email: '' }]);
    const successRef = useRef();
    const titleRef = useRef();
    const textRef = useRef();
    const btnRef = useRef();

    const cabinTypeMap = {
        'FIRST': '頭等艙',
        'BUSINESS': '商務艙',
        'ECONOMY': '經濟艙'
    }

    const cabinDescriptionMap = {
        'FIRST': {
            features: ['享受最奢華的飛行體驗', '180度全平躺座椅', '專屬貴賓室', '機上米其林餐點', '優先登機與行李托運'],
            baggage: '40公斤',
            meal: '米其林主廚特製餐點',
        },
        'BUSINESS': {
            features: ['舒適商務座椅', '商務艙貴賓室', '優質餐飲服務', '優先登機'],
            baggage: '30公斤',
            meal: '商務艙特選餐點',
        },
        'ECONOMY': {
            features: ['標準座椅', '基本餐飲服務'],
            baggage: '20公斤',
            meal: '經濟艙餐點',
        }
    }


    const handleAddPassenger = () => {
        setPassengers([...passengers, { name: '', gender: '', birthDate: '', passportNumber: '', email: '' }])
    }

    const handleRemovePassenger = (index) => {
        const newPassengers = passengers.filter((_, i) => i !== index)
        setPassengers(newPassengers)
    }

    const handlePassengerChange = (index, field, value) => {
        const newPassengers = [...passengers]
        newPassengers[index][field] = value
        setPassengers(newPassengers)
    }

    const handleSubmit = async () => {
        if (!selectedClass) {
            toast.error('請選擇艙等')
            return
        }

        if (passengers.some(p => !p.name || !p.gender || !p.birthDate || !p.passportNumber || !p.email)) {
            toast.error('請填寫完整的乘客信息')
            return
        }

        if (!flightData || !flightData.flightInfo || !flightData.price) {
            toast.error('航班信息不完整')
            return
        }

        // 构建正确的订单 payload
        const result = await request('POST', '/flight/order', {
            flightInfo: flightData.flightInfo,
            passengerInfo: passengers,
            category: selectedClass,
            price: flightData.price
        }, setLoading)

        if (result.success) {
            toast.success('訂票成功！')
            setBookingSuccess(true)
        } else toast.error(result.message)
    }


    useEffect(() => {
        let flightInfo = null;
        
        if (location.state?.flightInfo) {
            console.log('从location.state获取航班信息');
            flightInfo = {
                flightInfo: location.state.flightInfo,
                price: location.state.price,
                tripType: location.state.tripType
            };
        }
        else if (selectedFlight) {
            console.log('从Redux获取航班信息');
            flightInfo = selectedFlight;
        }
        else {
            console.log('尝试从sessionStorage恢复航班信息');
            dispatch(restoreSelectedFlight());
            const timer = setTimeout(() => {
                try {
                    const cachedFlight = sessionStorage.getItem('selectedFlight');
                    if (cachedFlight) {
                        const parsedFlight = JSON.parse(cachedFlight);
                        console.log('成功从sessionStorage恢复航班信息');
                        setFlightData(parsedFlight);
                        setSelectedClass('ECONOMY');
                        return;
                    }
                } catch (error) {
                    console.error('从sessionStorage解析航班信息失败:', error);
                }
                console.warn('无法恢复航班信息，重定向到航班搜索页');
                toast.error('航班信息已过期，请重新选择航班');
                navigate('/flight');
            }, 100);
            
            return () => clearTimeout(timer);
        }
        if (flightInfo) {
            console.log('设置航班数据:', flightInfo);
            setFlightData(flightInfo);
            setSelectedClass('ECONOMY');
        }
        
    }, [location.state, selectedFlight, dispatch, navigate]);


    // GSAP動畫
    useEffect(() => {
        if (bookingSuccess) {
            const tl = gsap.timeline({ defaults: { ease: 'power2.out', duration: 0.6 } });
            tl.from(successRef.current, { opacity: 0 })
                .from(titleRef.current, { y: -30, opacity: 0 }, '-=0.3')
                .from(textRef.current?.children || [], { y: 20, opacity: 0, stagger: 0.2 }, '-=0.4')
                .from(btnRef.current, { scale: 0.8, opacity: 0 }, '-=0.4');
        }
    }, [bookingSuccess]);




    if (!flightData) {
        return (
            <div className="bookingFlight">
                <Navbar />
                <div className="bookingContainer">
                    <h1><Skeleton width={200} /></h1>
                    <div className="flightDetails">
                        <div className="flightHeader">
                            <div><Skeleton width={150} /></div>
                        </div>
                        <div className="routeInfo">
                            <div className="departure">
                                <Skeleton width={100} height={30} />
                                <Skeleton width={80} />
                            </div>
                            <div className="arrow">
                                <Skeleton width={50} />
                            </div>
                            <div className="arrival">
                                <Skeleton width={100} height={30} />
                                <Skeleton width={80} />
                            </div>
                        </div>
                        <div className="cabinSelection">
                            <div><Skeleton width={120} /></div>
                            <div className="cabinOptions">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="cabinOption">
                                        <Skeleton width={150} height={100} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (bookingSuccess) {
        return (
            <div className="bookingFlight">
                <Navbar />
                <div className="bookingContainer successContainer" ref={successRef} >
                    <h2 ref={titleRef} className="successTitle">
                        🎉 訂票成功！
                    </h2>
                    <div ref={textRef}>
                        <p>感謝您的預訂，我們已收到您的航班資訊。</p>
                        <p>請至「我的帳戶」查看詳細資料。</p>
                    </div>
                    <button
                        ref={btnRef}
                        className="backHomeBtn"
                        onClick={() => (window.location.href = '/personal')}
                    >
                        我的帳戶
                    </button>
                </div>
            </div>
        );
    }
    return (
        <div className="bookingFlight">
            <Navbar />
            <div className="bookingContainer">
                <div className="progressSteps">
                    <div className="step flightActive">
                        <div className="stepNumber">1</div>
                        <div className="stepText">查詢行程</div>
                    </div>
                    <div className="step flightActive">
                        <div className="stepNumber">2</div>
                        <div className="stepText">選擇航班</div>
                    </div>
                    <div className="step flightActive">
                        <div className="stepNumber">3</div>
                        <div className="stepText">填寫資料</div>
                    </div>
                    <div className="step">
                        <div className="stepNumber">4</div>
                        <div className="stepText">完成訂購</div>
                    </div>
                </div>


                <div className="flightDetails">
                    <div className="flightHeader">
                        <h2>航班號：{flightData?.flightInfo?.airline} {flightData?.flightInfo?.flightNumber}</h2>
                        <div className="flightDate">
                            <div>
                                {flightData?.flightInfo?.departureTime && dayjs(flightData.flightInfo.departureTime).format('YYYY年MM月DD日 dddd')}
                            </div>
                        </div>
                    </div>

                    <div className="routeInfo">
                        <div className="departure">
                            <div className="city">{flightData?.flightInfo?.departureAirport}</div>
                            <div className="time">
                                {flightData?.flightInfo?.departureTime && dayjs(flightData.flightInfo.departureTime).format('HH:mm')}
                            </div>
                        </div>

                        <div className="arrow">
                            ✈️ {formatDuration(flightData?.flightInfo?.itineraryDuration)}
                        </div>

                        <div className="arrival">
                            <div className="city">{flightData?.flightInfo?.arrivalAirport}</div>
                            <div className="time">
                                {flightData?.flightInfo?.arrivalTime && dayjs(flightData.flightInfo.arrivalTime).format('HH:mm')}
                            </div>
                        </div>
                    </div>

                    <div className="cabinSelection">
                        <div className="cabinTitle">選擇艙等</div>
                        <div className="cabinDescription">
                            請選擇您想要的艙等，每個艙等都提供不同的服務與特權
                        </div>
                        <div className="cabinOptions">
                            {['ECONOMY', 'BUSINESS', 'FIRST'].map((category) => {
                                // 根據艙等計算價格倍數
                                const priceMultiplier = {
                                    'ECONOMY': 1,
                                    'BUSINESS': 1.5,
                                    'FIRST': 2
                                };
                                const basePrice = flightData?.price?.basePrice || 0;
                                const cabin_price = (basePrice * (priceMultiplier[category] || 1)).toFixed(2);

                                return (
                                    <div
                                        key={category}
                                        className={`cabinOption ${selectedClass === category ? 'selected' : ''}`}
                                        onClick={() => setSelectedClass(category)}
                                    >
                                        <div className="cabinHeader">
                                            <div className="cabinType">{cabinTypeMap[category]}</div>
                                            <div className="price">${cabin_price}</div>
                                        </div>
                                        <div className="cabinDetails">
                                            <div className="seats">可購買 {flightData?.flightInfo?.availableSeats || 0} 座</div>
                                            <div className="features">
                                                <div className="featureTitle">艙等特權：</div>
                                                <ul>
                                                    {cabinDescriptionMap[category].features.map((feature, index) => (
                                                        <li key={index}>{feature}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="additionalInfo">
                                                <div>托運行李：{cabinDescriptionMap[category].baggage}</div>
                                                <div>餐點服務：{cabinDescriptionMap[category].meal}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>


                    <div className="passengerInfo">
                        <h2>旅客資訊</h2>
                        <div className="infoNotice">
                            <p>請正確輸入旅行文件上所登載的姓名。如果您的姓名不正確，您可能無法登機且必須支付取消手續費。</p>
                            <p>為了能順利出遊，請確認旅客的旅行文件於旅程結束當日，仍有至少 6 個月有效期。</p>
                        </div>
                        {passengers.map((passenger, index) => (
                            <div key={index} className="passengerForm">
                                <div className="fieldRow">
                                    <div className="field">
                                        <label>姓名</label>
                                        <input
                                            type="text"
                                            placeholder="請輸入姓名"
                                            value={passenger.name}
                                            onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
                                        />
                                    </div>
                                    <div className="field">
                                        <label>性別</label>
                                        <select
                                            value={passenger.gender}
                                            onChange={(e) => handlePassengerChange(index, 'gender', Number(e.target.value))}
                                        >
                                            <option value="">請選擇性別</option>
                                            <option value="1">男</option>
                                            <option value="0">女</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="fieldRow">
                                    <div className="field">
                                        <label>出生日期</label>
                                        <input
                                            type="date"
                                            value={passenger.birthDate}
                                            onChange={(e) => handlePassengerChange(index, 'birthDate', e.target.value)}
                                        />
                                    </div>
                                    <div className="field">
                                        <label>護照號碼</label>
                                        <input
                                            type="text"
                                            placeholder="請輸入護照號碼"
                                            value={passenger.passportNumber}
                                            onChange={(e) => handlePassengerChange(index, 'passportNumber', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="fieldRow">
                                    <div className="field">
                                        <label>電子郵件</label>
                                        <input
                                            type="email"
                                            placeholder="請輸入電子郵件"
                                            value={passenger.email}
                                            onChange={(e) => handlePassengerChange(index, 'email', e.target.value)}
                                        />
                                    </div>

                                    {passengers.length > 1 && (
                                        <button
                                            className="removeBtn"
                                            onClick={() => handleRemovePassenger(index)}
                                        >
                                            移除旅客
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        <button className="addBtn" onClick={handleAddPassenger}>
                            新增旅客
                        </button>
                    </div>


                    <button
                        className="bookButton"
                        disabled={!selectedClass || loading}
                        onClick={handleSubmit}
                    >
                        {loading ? '訂票中...' : '確認訂票'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default BookingFlight