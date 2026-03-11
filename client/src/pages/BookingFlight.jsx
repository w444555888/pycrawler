import React, { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './bookingFlight.scss'
import { zhTW } from 'date-fns/locale'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlane } from '@fortawesome/free-solid-svg-icons'
import { request } from '../utils/apiService'
import { getTimeZoneByCity } from '../utils/getTimeZoneByCity'
import dayjs from '../utils/dayjs-config'
import gsap from 'gsap';
import { toast } from 'react-toastify'
import Skeleton from 'react-loading-skeleton'

const BookingFlight = () => {
    const { id } = useParams()
    const [searchParams] = useSearchParams()
    const [loading, setLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedScheduleId, setSelectedScheduleId] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [flightData, setFlightData] = useState(null);
    const [passengers, setPassengers] = useState([{ name: '', gender: '', birthDate: '', passportNumber: '', email: '' }]);
    const [isNextDay, setIsNextDay] = useState(false);
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


    const getCabinClasses = (availableSeats, prices) => {
        if (!availableSeats || !prices) return []
        return Object.entries(availableSeats).map(([category, seats]) => ({
            category,
            availableSeats: seats,
            basePrice: prices[category]
        }))
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

        const result = await request('POST', '/flight/order', {
            flightId: id,
            category: selectedClass,
            scheduleId: selectedScheduleId,
            passengerInfo: passengers
        }, setLoading)

        if (result.success) {
            toast.success('訂票成功！')
            setBookingSuccess(true)
        } else toast.error(result.message)
    }


    useEffect(() => {
        const handleBookingFlight = async () => {
            const result = await request('GET', `/flight/${id}?${searchParams.toString()}`, {}, setLoading)
            if (result.success) {
                setFlightData(result.data)
                if (result.data.schedules.length > 0) {
                    setSelectedDate(result.data.schedules[0].departureDate)
                    setSelectedScheduleId(result.data.schedules[0]._id)
                    // 計算是否為隔天（以 UTC 日期為準）
                    const arrivalDateStr = dayjs.utc(result.data.schedules[0].arrivalDate).format('YYYY-MM-DD')
                    const departureDateStr = dayjs.utc(result.data.schedules[0].departureDate).format('YYYY-MM-DD')

                    setIsNextDay(arrivalDateStr !== departureDateStr)
                }
            } else toast.error(result.message)
        }

        handleBookingFlight()
    }, [id, searchParams])


    // GSAP 動畫效果
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
                    <h2 ref={titleRef} style={{ fontSize: 28, color: '#4caf50' }}>
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
                        <h2>航班號：{flightData.flightNumber}</h2>
                        <div className="flightDate">
                            {selectedDate && (
                                <div>
                                    {dayjs.utc(selectedDate).tz(getTimeZoneByCity(flightData.route.departureCity)).format('YYYY年MM月DD日 dddd')}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="routeInfo">
                        <div className="departure">
                            <div className="city">{flightData.route.departureCity}</div>
                            <div className="time">
                                {dayjs.utc(flightData.schedules[0].departureDate)
                                    .tz(getTimeZoneByCity(flightData.route.departureCity))
                                    .format('HH:mm')}
                                <div className="timezone">
                                    <span>
                                        (GMT{dayjs().tz(getTimeZoneByCity(flightData.route.departureCity)).format('Z')})
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="arrow">
                            {Math.floor(flightData.route.flightDuration / 60)}小時
                            {flightData.route.flightDuration % 60}分 <FontAwesomeIcon icon={faPlane} />
                        </div>

                        <div className="arrival">
                            <div className="city">{flightData.route.arrivalCity}</div>
                            <div className="time">
                                {dayjs.utc(flightData.schedules[0].arrivalDate)
                                    .tz(getTimeZoneByCity(flightData.route.arrivalCity))
                                    .format('HH:mm')}

                                {isNextDay && <span className="nextDay">+1</span>}

                                <div className="timezone">
                                    <span> (GMT{dayjs().tz(getTimeZoneByCity(flightData.route.arrivalCity)).format('Z')})</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="cabinSelection">
                        <div className="cabinTitle">選擇艙等</div>
                        <div className="cabinDescription">
                            請選擇您想要的艙等，每個艙等都提供不同的服務與特權
                        </div>
                        <div className="cabinOptions">
                            {flightData && flightData.schedules[0] &&
                                getCabinClasses(
                                    flightData.schedules[0].availableSeats,
                                    flightData.schedules[0].prices
                                ).map((cabin) => (
                                    <div
                                        key={cabin.category}
                                        className={`cabinOption ${selectedClass === cabin.category ? 'selected' : ''}`}
                                        onClick={() => setSelectedClass(cabin.category)}
                                    >
                                        <div className="cabinHeader">
                                            <div className="cabinType">{cabinTypeMap[cabin.category]}</div>
                                            <div className="price">${cabin.basePrice}</div>
                                        </div>
                                        <div className="cabinDetails">
                                            <div className="seats">剩餘座位: {cabin.availableSeats}</div>
                                            <div className="features">
                                                <div className="featureTitle">艙等特權：</div>
                                                <ul>
                                                    {cabinDescriptionMap[cabin.category].features.map((feature, index) => (
                                                        <li key={index}>{feature}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="additionalInfo">
                                                <div>托運行李：{cabinDescriptionMap[cabin.category].baggage}</div>
                                                <div>餐點服務：{cabinDescriptionMap[cabin.category].meal}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
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