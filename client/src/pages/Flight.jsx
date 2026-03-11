import React, { useState, useEffect, useRef, useMemo } from 'react'
import './flight.scss'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlane, faCalendarDays } from '@fortawesome/free-solid-svg-icons'
import { DateRange } from 'react-date-range'
import Navbar from '../components/Navbar'
import { format, parse, addMinutes } from 'date-fns'
import zhTW from 'date-fns/locale/zh-TW'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { debounce } from 'lodash'
import { request } from '../utils/apiService';
import { getTimeZoneByCity } from '../utils/getTimeZoneByCity';
import dayjs from '../utils/dayjs-config';
import { toast } from 'react-toastify'
import EmptyState from '../subcomponents/EmptyState'



const Flight = () => {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams();
    const [arrivalCity, setArrivalCity] = useState("")
    const [departureCity, setDepartureCity] = useState("")
    const [departureIata, setDepartureIata] = useState("")
    const [arrivalIata, setArrivalIata] = useState("")
    const [tripType, setTripType] = useState("roundtrip")  // "roundtrip" 或 "oneway"
    const [openDate, setOpenDate] = useState(false)
    const [flights, setFlights] = useState([])
    const [dates, setDates] = useState([
        {
            startDate: null,
            endDate: null,
            key: 'selection'
        }
    ])
    // 地點搜尋相關狀態
    const [departureSuggestions, setDepartureSuggestions] = useState([])
    const [arrivalSuggestions, setArrivalSuggestions] = useState([])
    const [showDepartureSuggestions, setShowDepartureSuggestions] = useState(false)
    const [showArrivalSuggestions, setShowArrivalSuggestions] = useState(false)
    const [loadingDeparture, setLoadingDeparture] = useState(false)
    const [loadingArrival, setLoadingArrival] = useState(false)
    const departureInputRef = useRef(null)
    const arrivalInputRef = useRef(null)
    const departureContainerRef = useRef(null)
    const arrivalContainerRef = useRef(null)



    useEffect(() => {
        setFlights([])
    }, [])

    // 點擊外部關閉建議列表
    useEffect(() => {
        const handleClickOutside = (e) => {
            // 如果點擊在出發地容器外，關閉出發地建議
            if (departureContainerRef.current && !departureContainerRef.current.contains(e.target)) {
                setShowDepartureSuggestions(false)
            }
            // 如果點擊在目的地容器外，關閉目的地建議
            if (arrivalContainerRef.current && !arrivalContainerRef.current.contains(e.target)) {
                setShowArrivalSuggestions(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // 非防抖版本的搜尋函數（用於實際 API 調用）
    const performDepartureSearch = async (keyword) => {
        if (keyword.trim().length < 2) {
            setDepartureSuggestions([])
            return
        }
        setLoadingDeparture(true)
        const result = await request('GET', `/flight/locations/search?keyword=${keyword}`)
        if (result.success) {
            setDepartureSuggestions(result.data)
        } else {
            setDepartureSuggestions([])
        }
        setLoadingDeparture(false)
    }

    const performArrivalSearch = async (keyword) => {
        if (keyword.trim().length < 2) {
            setArrivalSuggestions([])
            return
        }
        setLoadingArrival(true)
        const result = await request('GET', `/flight/locations/search?keyword=${keyword}`)
        if (result.success) {
            setArrivalSuggestions(result.data)
        } else {
            setArrivalSuggestions([])
        }
        setLoadingArrival(false)
    }

    // 防抖
    const searchDeparture = useMemo(() => debounce(performDepartureSearch, 500), [])
    const searchArrival = useMemo(() => debounce(performArrivalSearch, 500), [])

    // 選擇出發地
    const handleSelectDeparture = (location) => {
        setDepartureCity(location.name)
        setDepartureIata(location.iataCode)
        setShowDepartureSuggestions(false)
        setDepartureSuggestions([])
    }

    // 選擇目的地
    const handleSelectArrival = (location) => {
        setArrivalCity(location.name)
        setArrivalIata(location.iataCode)
        setShowArrivalSuggestions(false)
        setArrivalSuggestions([])
    }


    const handleSearch = async () => {
        // 驗證必填欄位
        if (!departureIata || !arrivalIata || !dates[0].startDate) {
            toast.error('請填寫出發地、目的地和日期')
            return
        }

        // 如果是來回，需要驗證回程日期
        if (tripType === "roundtrip" && !dates[0].endDate) {
            toast.error('請選擇回程日期')
            return
        }

        const params = {};

        if (departureIata) {
            params.origin = departureIata
        }

        if (arrivalIata) {
            params.destination = arrivalIata
        }

        if (dates[0].startDate) {
            params.date = format(dates[0].startDate, 'yyyy-MM-dd');
        }

        // 如果是來回，添加回程日期參數
        if (tripType === "roundtrip" && dates[0].endDate) {
            params.returnDate = format(dates[0].endDate, 'yyyy-MM-dd');
        }

        setSearchParams(params);
        const result = await request('GET', `/flight/search?${new URLSearchParams(params).toString()}`);
        if (result.success) {
            setFlights(result.data);
            toast.success('搜索完成');
        } else toast.error(result.message);
    };


    const handleBookingFlightRouter = (flightData) => {
        // 通过 navigate 的 state 传递完整的航班信息
        navigate(`/bookingFlight`, {
            state: {
                flightInfo: flightData.flightInfo,
                price: flightData.price,
                tripType: flightData.tripType
            }
        });
    };


    return (
        <div className='flight'>
            <Navbar />
            <div className="flightContainer">
                <h1 className="title">航班查詢</h1>
                <div className="searchSection">
                    <div className="searchInputs">
                        {/* 來回/單程選擇 */}
                        <div className="tripTypeSelector" style={{ 
                            display: 'flex', 
                            gap: '10px', 
                            marginBottom: '15px',
                            width: '100%'
                        }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="tripType"
                                    value="roundtrip"
                                    checked={tripType === "roundtrip"}
                                    onChange={(e) => setTripType(e.target.value)}
                                />
                                來回
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="tripType"
                                    value="oneway"
                                    checked={tripType === "oneway"}
                                    onChange={(e) => setTripType(e.target.value)}
                                />
                                單程
                            </label>
                        </div>

                        <div className="searchItem" ref={departureContainerRef} style={{ position: 'relative' }}>
                            <FontAwesomeIcon icon={faPlane} className="icon" />
                            <input
                                ref={departureInputRef}
                                type="text"
                                placeholder="出發地"
                                value={departureCity}
                                onChange={(e) => {
                                    setDepartureCity(e.target.value)
                                    setDepartureIata("")
                                    searchDeparture(e.target.value)
                                    setShowDepartureSuggestions(true)
                                }}
                                onFocus={() => setShowDepartureSuggestions(true)}
                                className="searchInput"
                            />
                            {showDepartureSuggestions && (departureSuggestions.length > 0 || loadingDeparture) && (
                                <div className="suggestionsList">
                                    {loadingDeparture ? (
                                        <div className="suggestionItem">搜尋中...</div>
                                    ) : (
                                        departureSuggestions.map((location, index) => (
                                            <div
                                                key={index}
                                                className="suggestionItem"
                                                onClick={() => handleSelectDeparture(location)}
                                            >
                                                <div className="locationName">{location.name}</div>
                                                <div className="locationDetails">
                                                    {location.iataCode} • {location.countryName}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="searchItem" ref={arrivalContainerRef} style={{ position: 'relative' }}>
                            <FontAwesomeIcon icon={faPlane} className="icon" />
                            <input
                                ref={arrivalInputRef}
                                type="text"
                                placeholder="目的地"
                                value={arrivalCity}
                                onChange={(e) => {
                                    setArrivalCity(e.target.value)
                                    setArrivalIata("")
                                    searchArrival(e.target.value)
                                    setShowArrivalSuggestions(true)
                                }}
                                onFocus={() => setShowArrivalSuggestions(true)}
                                className="searchInput"
                            />
                            {showArrivalSuggestions && (arrivalSuggestions.length > 0 || loadingArrival) && (
                                <div className="suggestionsList">
                                    {loadingArrival ? (
                                        <div className="suggestionItem">搜尋中...</div>
                                    ) : (
                                        arrivalSuggestions.map((location, index) => (
                                            <div
                                                key={index}
                                                className="suggestionItem"
                                                onClick={() => handleSelectArrival(location)}
                                            >
                                                <div className="locationName">{location.name}</div>
                                                <div className="locationDetails">
                                                    {location.iataCode} • {location.countryName}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="searchItem">
                            <FontAwesomeIcon icon={faCalendarDays}
                                className="icon"
                                onClick={() => setOpenDate(!openDate)} />
                            <span
                                onClick={() => setOpenDate(!openDate)}
                                className="searchText"
                            >
                                {tripType === "roundtrip" 
                                    ? (dates[0].startDate && dates[0].endDate
                                        ? `${format(dates[0].startDate, "MM/dd/yyyy")} - ${format(dates[0].endDate, "MM/dd/yyyy")}`
                                        : "請選擇來回日期")
                                    : (dates[0].startDate
                                        ? format(dates[0].startDate, "MM/dd/yyyy")
                                        : "請選擇出發日期")
                                }
                            </span>
                            {openDate && (
                                <DateRange
                                    editableDateInputs={true}
                                    onChange={(item) => setDates([item.selection])}
                                    moveRangeOnFirstSelection={tripType === "oneway"}
                                    ranges={dates}
                                    className="date"
                                    minDate={new Date()}
                                    locale={zhTW}
                                />
                            )}
                        </div>
                        <button className="searchButton" onClick={handleSearch}>
                            搜尋航班
                        </button>
                    </div>
                </div>
                <div className="flightList">
                    {flights.length > 0 ? (
                        flights.map((flight, index) => {
                            const flightInfo = flight.flightInfo || {};
                            const price = flight.price || {};
                            
                            // 解析時間
                            const departureTime = flightInfo.departureTime ? dayjs(flightInfo.departureTime) : null;
                            const arrivalTime = flightInfo.arrivalTime ? dayjs(flightInfo.arrivalTime) : null;

                            return (
                                <div className="flightItem" key={`${flightInfo.flightId}-${index}`}>
                                    <div className="flightInfo">
                                        <div className="airline">
                                            {flightInfo.airline} {flightInfo.flightNumber}
                                        </div>
                                        <div className="date">
                                            出發日期：{departureTime ? departureTime.format('YYYY-MM-DD') : 'N/A'}
                                        </div>
                                        <div className="price" style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                                            價格：${price.totalPrice || 'N/A'}
                                        </div>
                                    </div>
                                    <div className="routeInfo">
                                        <div className="departure">
                                            <div className="city">{flightInfo.departureAirport}</div>
                                            <div className="time">
                                                {departureTime ? departureTime.format('HH:mm') : 'N/A'}
                                            </div>
                                        </div>
                                        <div className="arrow">→</div>
                                        <div className="arrival">
                                            <div className="city">{flightInfo.arrivalAirport}</div>
                                            <div className="time">
                                                {arrivalTime ? arrivalTime.format('HH:mm') : 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bookSection">
                                        <button
                                            className="bookButton"
                                            onClick={() => handleBookingFlightRouter(flight)}
                                        >
                                            訂票
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <EmptyState
                            title="目前沒有符合條件的航班"
                            description="很抱歉，我們無法找到相關的航班資訊"
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default Flight