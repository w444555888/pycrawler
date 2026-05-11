import React, { useState, useEffect, useRef, useMemo } from 'react'
import './flight.scss'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlane, faCalendarDays } from '@fortawesome/free-solid-svg-icons'
import { DateRange, Calendar } from 'react-date-range'
import Navbar from '@/components/Navbar'
import { format, parse, addMinutes } from 'date-fns'
import zhTW from 'date-fns/locale/zh-TW'
import { useNavigate, useSearchParams } from 'next/navigation'
import { debounce } from 'lodash'
import { request } from '@/utils/api/client';
import dayjs from '@/utils/dayjs-config';
import formatDuration from '@/utils/formatDuration';
import { toast } from 'react-toastify'
import EmptyState from '../subcomponents/EmptyState'
import Skeleton from 'react-loading-skeleton'
import { useDispatch, useSelector } from 'react-redux'
import { 
  fetchFlights,
  fetchAirportSuggestions,
  setSelectedFlight,
  setDepartureCity,
  setArrivalCity,
  setDepartureIata,
  setArrivalIata,
  resetFlightStore,
  setShowDepartureSuggestions,
  setShowArrivalSuggestions
} from '@/redux/flightStore'


const Flight = () => {
    const navigate = useRouter()
    const dispatch = useDispatch()
    const [searchParams, setSearchParams] = useSearchParams();
 
    // Redux
    const { 
        searchResults: flights,
        selectedFlight,
        searchParams: { departureCity, arrivalCity, departureIata, arrivalIata },
        departureSuggestions: { items: departureSuggestions, showSuggestions: showDepartureSuggestions, loading: departureLoading, page: departurePage, hasNext: departureHasNext },
        arrivalSuggestions: { items: arrivalSuggestions, showSuggestions: showArrivalSuggestions, loading: arrivalLoading, page: arrivalPage, hasNext: arrivalHasNext },
        searchLoading,
        pagination
    } = useSelector(state => state.flight)
    
    // 本地狀態
    const [tripType, setTripType] = useState("roundtrip")
    const [openDate, setOpenDate] = useState(false)
    const [dates, setDates] = useState([
        {
            startDate: null,
            endDate: null,
            key: 'selection'
        }
    ])
    
    const departureInputRef = useRef(null)
    const arrivalInputRef = useRef(null)
    const departureContainerRef = useRef(null)
    const arrivalContainerRef = useRef(null)
    const departureSuggestionsRef = useRef(null)
    const arrivalSuggestionsRef = useRef(null)
    const flightListRef = useRef(null)

    useEffect(() => {
        dispatch(resetFlightStore())
    }, [])


    // 點擊外部關閉列表
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (departureContainerRef.current && !departureContainerRef.current.contains(e.target)) {
                dispatch(setShowDepartureSuggestions(false))
            }
            if (arrivalContainerRef.current && !arrivalContainerRef.current.contains(e.target)) {
                dispatch(setShowArrivalSuggestions(false))
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])



    // 非防抖版本的搜尋函數
    const performDepartureSearch = async (keyword) => {
        if (keyword.trim().length < 2) {
            return
        }
        dispatch(fetchAirportSuggestions({ type: 'departure', keyword, page: 1, append: false }))
    }

    const performArrivalSearch = async (keyword) => {
        if (keyword.trim().length < 2) {
            return
        }
        dispatch(fetchAirportSuggestions({ type: 'arrival', keyword, page: 1, append: false }))
    }


    // 搜尋航班防抖
    const searchDeparture = useMemo(() => debounce(performDepartureSearch, 500), [])
    const searchArrival = useMemo(() => debounce(performArrivalSearch, 500), [])



    // 航班地點搜尋加載更多函數
    const loadMoreDeparture = async () => {
        if (departureLoading || !departureHasNext) return
        
        const keyword = departureCity  || ''
        const currentPage = departurePage || 1
        
        if (keyword) {
            dispatch(fetchAirportSuggestions({ 
                type: 'departure', 
                keyword: keyword, 
                page: currentPage + 1, 
                append: true 
            }))
        }
    }

    const loadMoreArrival = async () => {
        if (arrivalLoading || !arrivalHasNext) return
        
        const keyword = arrivalCity || ''
        const currentPage = arrivalPage || 1
        
        if (keyword) {
            dispatch(fetchAirportSuggestions({ 
                type: 'arrival', 
                keyword: keyword, 
                page: currentPage + 1, 
                append: true 
            }))
        }
    }
    

    // 航班地點搜尋處理滾動
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


    
    // 選擇出發地
    const handleSelectDeparture = (location) => {
        dispatch(setDepartureCity(location.name))
        dispatch(setDepartureIata(location.iataCode))
        dispatch(setShowDepartureSuggestions(false))
    }

    // 選擇目的地
    const handleSelectArrival = (location) => {
        dispatch(setArrivalCity(location.name))
        dispatch(setArrivalIata(location.iataCode))
        dispatch(setShowArrivalSuggestions(false))
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
        dispatch(fetchFlights({ params, page: 1 }))
    };

    // 加載更多航班
    const loadMoreFlights = async () => {
        const totalPages = Math.ceil(pagination.total / pagination.pageSize);
        if (searchLoading || pagination.current >= totalPages) return
        
        const searchParamsObj = {
            origin: departureIata,
            destination: arrivalIata,
            date: dates[0].startDate ? format(dates[0].startDate, 'yyyy-MM-dd') : '',
            returnDate: tripType === 'roundtrip' && dates[0].endDate ? format(dates[0].endDate, 'yyyy-MM-dd') : null,
            tripType: tripType
        }
        
        const currentPage = pagination?.current || 1
        
        if (searchParamsObj.origin && searchParamsObj.destination && searchParamsObj.date) {
            dispatch(fetchFlights({ 
                params: searchParamsObj, 
                page: currentPage + 1, 
                append: true 
            }))
        }
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
        dispatch(setSelectedFlight({
            flightInfo: flightData.flightInfo,
            price: flightData.price,
            tripType: flightData.tripType
        }));
        
        navigate.push(`/bookingFlight`);
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
                                onChange={e => {
                                    dispatch(setDepartureCity(e.target.value))
                                    dispatch(setDepartureIata(""))
                                    searchDeparture(e.target.value)
                                    dispatch(setShowDepartureSuggestions(true))
                                }}
                                onFocus={() => dispatch(setShowDepartureSuggestions(true))}
                                className="searchInput"
                            />
                            {showDepartureSuggestions && (departureSuggestions.length > 0 || departureLoading) && (
                                <div 
                                    className="suggestionsList"
                                    ref={departureSuggestionsRef}
                                    onScroll={handleDepartureSuggestionsScroll}
                                >
                                    {departureLoading && departureSuggestions.length === 0 ? (
                                        <>
                                            <div className="suggestionItem loading"><Skeleton height={20} /></div>
                                            <div className="suggestionItem loading"><Skeleton height={20} /></div>
                                            <div className="suggestionItem loading"><Skeleton height={20} /></div>
                                        </>
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
                                            {departureLoading && (
                                                <div className="suggestionItem loading"><Skeleton height={20} /></div>
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
                                onChange={e => {
                                    dispatch(setArrivalCity(e.target.value))
                                    dispatch(setArrivalIata(""))
                                    searchArrival(e.target.value)
                                    dispatch(setShowArrivalSuggestions(true))
                                }}
                                onFocus={() => dispatch(setShowArrivalSuggestions(true))}
                                className="searchInput"
                            />
                            {showArrivalSuggestions && (arrivalSuggestions.length > 0 || arrivalLoading) && (
                                <div 
                                    className="suggestionsList"
                                    ref={arrivalSuggestionsRef}
                                    onScroll={handleArrivalSuggestionsScroll}
                                >
                                    {arrivalLoading && arrivalSuggestions.length === 0 ? (
                                        <>
                                            <div className="suggestionItem loading"><Skeleton height={20} /></div>
                                            <div className="suggestionItem loading"><Skeleton height={20} /></div>
                                            <div className="suggestionItem loading"><Skeleton height={20} /></div>
                                        </>
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
                                            {arrivalLoading && (
                                                <div className="suggestionItem loading"><Skeleton height={20} /></div>
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
                                            }]);
                                            setOpenDate(false);
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
                                                <div className="city">
                                                    {flightInfo.departureAirport}
                                                    {flightInfo.departureTerminal && (
                                                        <span className="terminal">{`(T${flightInfo.departureTerminal})`}</span>
                                                    )}
                                                </div>
                                                <div className="time">
                                                    {departureTime ? departureTime.format('HH:mm') : 'N/A'}
                                                </div>
                                            </div>
                                            <div className="arrow">→</div>
                                            <div className="arrival">
                                                <div className="city">
                                                    {flightInfo.arrivalAirport}
                                                    {flightInfo.arrivalTerminal && (
                                                        <span className="terminal">{`(T${flightInfo.arrivalTerminal})`}</span>
                                                    )}
                                                </div>
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
                            {/* loading */}
                            {searchLoading && (
                                <div className="flightItem loading">
                                    <Skeleton height={120} />
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