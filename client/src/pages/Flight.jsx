import React, { useState, useEffect, useRef, useMemo } from 'react'
import './flight.scss'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlane, faCalendarDays } from '@fortawesome/free-solid-svg-icons'
import { DateRange, Calendar } from 'react-date-range'
import Navbar from '../components/Navbar'
import { format, parse, addMinutes } from 'date-fns'
import zhTW from 'date-fns/locale/zh-TW'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { debounce } from 'lodash'
import { request } from '../utils/apiService';
import dayjs from '../utils/dayjs-config';
import formatDuration from '../utils/formatDuration';
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
    const departureSuggestionsRef = useRef(null)
    const arrivalSuggestionsRef = useRef(null)
    
    // 分頁相關狀態
    const [departureCurrentPage, setDepartureCurrentPage] = useState(1)
    const [departureKeyword, setDepartureKeyword] = useState("")
    const [departureTotalPages, setDepartureTotalPages] = useState(0)
    const [departureLodingMore, setDepartureLoadingMore] = useState(false)
    
    const [arrivalCurrentPage, setArrivalCurrentPage] = useState(1)
    const [arrivalKeyword, setArrivalKeyword] = useState("")
    const [arrivalTotalPages, setArrivalTotalPages] = useState(0)
    const [arrivalLoadingMore, setArrivalLoadingMore] = useState(false)
    
    // 航班搜尋分頁相關狀態
    const [flightCurrentPage, setFlightCurrentPage] = useState(1)
    const [flightTotalPages, setFlightTotalPages] = useState(0)
    const [flightLoadingMore, setFlightLoadingMore] = useState(false)
    const [flightSearchParams, setFlightSearchParams] = useState(null)
    const flightListRef = useRef(null)



    useEffect(() => {
        setFlights([])
    }, [])

    // 點擊外部關閉建議列表
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (departureContainerRef.current && !departureContainerRef.current.contains(e.target)) {
                setShowDepartureSuggestions(false)
            }
            if (arrivalContainerRef.current && !arrivalContainerRef.current.contains(e.target)) {
                setShowArrivalSuggestions(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // 非防抖版本的搜尋函數
    const performDepartureSearch = async (keyword) => {
        if (keyword.trim().length < 2) {
            setDepartureSuggestions([])
            return
        }
        setLoadingDeparture(true)
        setDepartureKeyword(keyword)
        setDepartureCurrentPage(1)
        
        const result = await request('GET', `/flight/locations/search?keyword=${keyword}&page=1&limit=10`)
        if (result.success) {
            setDepartureSuggestions(result.data.items || [])
            setDepartureTotalPages(result.data.pagination?.totalPages || 0)
        } else {
            setDepartureSuggestions([])
            setDepartureTotalPages(0)
        }
        setLoadingDeparture(false)
    }

    const performArrivalSearch = async (keyword) => {
        if (keyword.trim().length < 2) {
            setArrivalSuggestions([])
            return
        }
        setLoadingArrival(true)
        setArrivalKeyword(keyword)
        setArrivalCurrentPage(1)
        
        const result = await request('GET', `/flight/locations/search?keyword=${keyword}&page=1&limit=10`)
        if (result.success) {
            setArrivalSuggestions(result.data.items || [])
            setArrivalTotalPages(result.data.pagination?.totalPages || 0)
        } else {
            setArrivalSuggestions([])
            setArrivalTotalPages(0)
        }
        setLoadingArrival(false)
    }

    // 加載更多函數
    const loadMoreDeparture = async () => {
        if (departureLodingMore || departureCurrentPage >= departureTotalPages || !departureKeyword) return
        
        setDepartureLoadingMore(true)
        const nextPage = departureCurrentPage + 1
        
        const result = await request('GET', `/flight/locations/search?keyword=${departureKeyword}&page=${nextPage}&limit=10`)
        if (result.success) {
            setDepartureSuggestions(prev => [...prev, ...(result.data.items || [])])
            setDepartureCurrentPage(nextPage)
        }
        setDepartureLoadingMore(false)
    }

    const loadMoreArrival = async () => {
        if (arrivalLoadingMore || arrivalCurrentPage >= arrivalTotalPages || !arrivalKeyword) return
        
        setArrivalLoadingMore(true)
        const nextPage = arrivalCurrentPage + 1
        
        const result = await request('GET', `/flight/locations/search?keyword=${arrivalKeyword}&page=${nextPage}&limit=10`)
        if (result.success) {
            setArrivalSuggestions(prev => [...prev, ...(result.data.items || [])])
            setArrivalCurrentPage(nextPage)
        }
        setArrivalLoadingMore(false)
    }

    // 處理滾動事件
    const handleDepartureSuggestionsScroll = () => {
        if (!departureSuggestionsRef.current) return
        
        const { scrollTop, scrollHeight, clientHeight } = departureSuggestionsRef.current
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            loadMoreDeparture()
        }
    }

    const handleArrivalSuggestionsScroll = () => {
        if (!arrivalSuggestionsRef.current) return
        
        const { scrollTop, scrollHeight, clientHeight } = arrivalSuggestionsRef.current
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            loadMoreArrival()
        }
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
        setFlightCurrentPage(1)
        setFlightSearchParams(params)
        
        const result = await request('GET', `/flight/search?${new URLSearchParams({...params, page: 1, limit: 10}).toString()}`);
        if (result.success) {
            setFlights(result.data.items || []);
            setFlightTotalPages(result.data.pagination?.totalPages || 0)
            toast.success('搜索完成');
        } else toast.error(result.message);
    };

    // 加載更多航班
    const loadMoreFlights = async () => {
        if (flightLoadingMore || flightCurrentPage >= flightTotalPages || !flightSearchParams) return
        
        setFlightLoadingMore(true)
        const nextPage = flightCurrentPage + 1
        
        const result = await request('GET', `/flight/search?${new URLSearchParams({...flightSearchParams, page: nextPage, limit: 10}).toString()}`);
        if (result.success) {
            setFlights(prev => [...prev, ...(result.data.items || [])])
            setFlightCurrentPage(nextPage)
        }
        setFlightLoadingMore(false)
    }

    // 處理航班列表滾動
    const handleFlightListScroll = () => {
        if (!flightListRef.current) return
        
        const { scrollTop, scrollHeight, clientHeight } = flightListRef.current
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            loadMoreFlights()
        }
    }


    const handleBookingFlightRouter = (flightData) => {
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
                        <div className="tripTypeSelector">
                            <label className="tripTypeLabel">
                                <input
                                    type="radio"
                                    name="tripType"
                                    value="roundtrip"
                                    checked={tripType === "roundtrip"}
                                    onChange={(e) => setTripType(e.target.value)}
                                />
                                來回
                            </label>
                            <label className="tripTypeLabel">
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

                        <div className="searchItem" ref={departureContainerRef}>
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
                                <div 
                                    className="suggestionsList"
                                    ref={departureSuggestionsRef}
                                    onScroll={handleDepartureSuggestionsScroll}
                                >
                                    {loadingDeparture && departureSuggestions.length === 0 ? (
                                        <div className="suggestionItem">搜尋中...</div>
                                    ) : (
                                        <>
                                            {departureSuggestions.map((location, index) => (
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
                                            ))}
                                            {departureLodingMore && (
                                                <div className="suggestionItem loading">加載中...</div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="searchItem" ref={arrivalContainerRef}>
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
                                <div 
                                    className="suggestionsList"
                                    ref={arrivalSuggestionsRef}
                                    onScroll={handleArrivalSuggestionsScroll}
                                >
                                    {loadingArrival && arrivalSuggestions.length === 0 ? (
                                        <div className="suggestionItem">搜尋中...</div>
                                    ) : (
                                        <>
                                            {arrivalSuggestions.map((location, index) => (
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
                                            ))}
                                            {arrivalLoadingMore && (
                                                <div className="suggestionItem loading">加載中...</div>
                                            )}
                                        </>
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
                                tripType === "oneway" ? (
                                    <Calendar
                                        key="calendar-oneway"
                                        date={dates[0].startDate || new Date()}
                                        onChange={(date) => {
                                            setDates([{
                                                startDate: date,
                                                endDate: null,
                                                key: 'selection'
                                            }])
                                            setOpenDate(false)
                                        }}
                                        minDate={new Date()}
                                        className="date"
                                        locale={zhTW}
                                    />
                                ) : (
                                    <DateRange
                                        key="daterange-roundtrip"
                                        editableDateInputs={true}
                                        onChange={(item) => {
                                            setDates([item.selection])
                                            // 自動收起：來回必須選兩個日期才收起
                                            if (item.selection.startDate && item.selection.endDate) {
                                                setOpenDate(false)
                                            }
                                        }}
                                        moveRangeOnFirstSelection={false}
                                        retainEndDateOnFirstSelection={true}
                                        ranges={dates}
                                        className="date"
                                        minDate={new Date()}
                                        locale={zhTW}
                                    />
                                )
                            )}
                        </div>
                        <button className="searchButton" onClick={handleSearch}>
                            搜尋航班
                        </button>
                    </div>
                </div>
                <div className="flightList" ref={flightListRef} onScroll={handleFlightListScroll}>
                    {flights.length > 0 ? (
                        <>
                            {flights.map((flight, index) => {
                                const flightInfo = flight.flightInfo || {};
                                const price = flight.price || {};
                                
                                // 解析時間
                                const departureTime = flightInfo.departureTime ? dayjs(flightInfo.departureTime) : null;
                                const arrivalTime = flightInfo.arrivalTime ? dayjs(flightInfo.arrivalTime) : null;

                                return (
                                    <div className="flightItem" key={`${flightInfo.flightId}-${index}`}>
                                        <div className="flightInfo">
                                            <div className="airlineHeader">
                                                <div className="airlineName">
                                                    <span className="airline">{flightInfo.airline}</span>
                                                    <span className="flightNumber">{flightInfo.flightNumber}</span>
                                                </div>
                                                <div className="departureInfo">
                                                    {departureTime ? departureTime.format('YYYY-MM-DD HH:mm') : 'N/A'}
                                                </div>
                                            </div>
                                            <div className="flightDetails">
                                                {flightInfo.itineraryDuration && (
                                                    <span className="duration">
                                                        ✈️ {formatDuration(flightInfo.itineraryDuration)}
                                                    </span>
                                                )}
                                                {flightInfo.availableSeats && (
                                                    <span className="seats">
                                                        💺 {flightInfo.availableSeats}座
                                                    </span>
                                                )}
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
                                                ${price.totalPrice || 'N/A'} 立即預訂
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {flightLoadingMore && (
                                <div className="flightItem loading">
                                    <div className="loadingText">加載中...</div>
                                </div>
                            )}
                        </>
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