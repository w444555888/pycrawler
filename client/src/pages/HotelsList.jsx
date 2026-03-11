import React, { useState, useEffect } from 'react'
import SearchItem from '../components/SearchItem'
import Navbar from '../components/Navbar'
import "./hotelsList.scss"
import { DateRange } from 'react-date-range'
import { format } from 'date-fns'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import ConditionSelector from '../components/ConditionSelector'
import DateRangePicker from '../components/DateRangePicker'
import { request } from '../utils/apiService'
import EmptyState from '../subcomponents/EmptyState'
import Skeleton from 'react-loading-skeleton'
import { toast } from 'react-toastify'
const HotelsList = () => {
    // 路由
    const [searchParams, setSearchParams] = useSearchParams()

    const [name, setName] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [conditions, setConditions] = useState({ adult: 1, room: 1 })
    const [isPopular, setIsPopular] = useState(false)
    const [dates, setDates] = useState([
        {
            startDate: new Date(),
            endDate: new Date(Date.now() + 86400000 * 1),
            key: 'selection',
        }
    ])

    useEffect(() => {
        const nameParam = searchParams.get('name') || ''
        const start = searchParams.get('startDate') || format(new Date(), 'yyyy-MM-dd')
        const end = searchParams.get('endDate') || format(new Date(Date.now() + 86400000 * 1), 'yyyy-MM-dd')
        const adult = parseInt(searchParams.get('adult')) || 1
        const room = parseInt(searchParams.get('room')) || 1
        const popular = searchParams.get('popular') === 'true'

        //回填首頁搜尋資料
        setName(nameParam)
        setStartDate(start)
        setEndDate(end)
        setIsPopular(popular)
        setConditions({ adult, room })

        setDates([
            {
                startDate: new Date(start),
                endDate: new Date(end),
                key: 'selection',
            }
        ])

        //發送搜尋請求
        const axiosHotels = async () => {
            const result = await request('GET', `/hotels/search?${searchParams.toString()}`, {}, setLoading)
            if (result.success) {
                setHotels(result.data)
            } else toast.error(`${result.message}`)
        }

        axiosHotels()
    }, [searchParams])


    const handleCounter = (name, sign) => {
        setConditions(prev => {
            return {
                ...prev,
                [name]: sign === "increase" ? conditions[name] + 1 : conditions[name] - 1
            }
        })
    }

    // 開關狀態
    const [openConditions, setOpenConditions] = useState(false)
    const [openCalendar, setOpenCalendar] = useState(false)


    // 飯店列表數據
    const [hotels, setHotels] = useState([])
    const [minPrice, setMinPrice] = useState('')
    const [maxPrice, setMaxPrice] = useState('')
    const [loading, setLoading] = useState(false)

    const handleDateChange = (item) => {
        setDates([item.selection])
        setStartDate(format(item.selection.startDate, "yyyy-MM-dd"))
        setEndDate(format(item.selection.endDate, "yyyy-MM-dd"))
        if (item.selection.startDate && item.selection.endDate &&
            format(item.selection.startDate, "yyyy-MM-dd") !== format(item.selection.endDate, "yyyy-MM-dd")) {
            setOpenCalendar(false)
        }
    }


    // 搜尋飯店條件
    const handleSearchHotelsPrice = () => {
        const params = {}
        if (name) params.name = name
        if (minPrice) params.minPrice = minPrice
        if (maxPrice) params.maxPrice = maxPrice
        if (startDate) params.startDate = startDate
        if (endDate) params.endDate = endDate
        if (conditions.adult) params.adult = conditions.adult
        if (conditions.room) params.room = conditions.room
        if (isPopular) params.popular = true
        setSearchParams(params)
    }

    return (
        <>
            <div>
                <Navbar />
                <div className="listContainer">
                    <div className="listWrapper">
                        <div className="listSearch">
                            <div className='searchTitle'>
                                搜尋目前最新資料
                            </div>
                            <div className="listItem">
                                <label>目的地／住宿名稱：</label>
                                <input type="text" className="searchInput" placeholder='要去哪裡?' value={name}
                                    onChange={e => setName(e.target.value)} />
                            </div>
                            <div className="listItem">
                                <label>入住/退房日期</label>
                                <span className='dates'>
                                    <div className="searchInput" onClick={() => setOpenCalendar(!openCalendar)} >
                                        {format(dates[0].startDate, "MM/dd/yyyy")} - {format(dates[0].endDate, "MM/dd/yyyy")}
                                    </div>
                                    {openCalendar && (
                                        <DateRangePicker
                                            dates={dates}
                                            setDates={setDates}
                                            setStartDate={setStartDate}
                                            setEndDate={setEndDate}
                                            onClose={() => setOpenCalendar(false)}
                                        />
                                    )}
                                </span>
                            </div>

                            <div className="listItem">
                                <div className="listItemLimitPrice">
                                    <span className="limitTitle">
                                        每晚最低價格
                                    </span>
                                    <input type="text" className='searchInput'
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                        required />
                                </div>

                                <div className="listItemLimitPrice">
                                    <span className="limitTitle">
                                        每晚最高價格
                                    </span>
                                    <input type="text" className='searchInput'
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                        required />
                                </div>

                                <span className="limitTitle">
                                    人數/房間數
                                </span>
                                <div className="listItmConditions">
                                    <span className="searchText" onClick={() => setOpenConditions(!openConditions)}>
                                        {`${conditions.adult} 位成人 · ${conditions.room} 間房`}
                                    </span>
                                    {openConditions && (
                                        <ConditionSelector
                                            conditions={conditions}
                                            setConditions={setConditions}
                                        />
                                    )}
                                </div>

                                <div className="listItem">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={isPopular}
                                            onChange={e => setIsPopular(e.target.checked)}
                                        />
                                        僅顯示受歡迎的飯店
                                    </label>
                                </div>
                            </div>
                            <div className="listItem">
                                <button className='searchbtn' onClick={handleSearchHotelsPrice}>搜尋</button>
                            </div>
                        </div>

                        <div className="listResult">
                            <div className="resultTitle">
                                <h2>在{name ? name : '全區域搜尋'}找到{hotels.length}間房間</h2>
                            </div>

                            {loading ? (
                                Array(3).fill().map((_, index) => (
                                    <div key={index} className="skeleton-item">
                                        <div className="skeleton-wrapper">
                                            <Skeleton className="skeleton-image" />
                                            <div className="skeleton-content">
                                                <Skeleton className="skeleton-title" />
                                                <Skeleton count={3} className="skeleton-text" />
                                                <div className="skeleton-footer">
                                                    <Skeleton className="skeleton-price" />
                                                    <Skeleton className="skeleton-button" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : hotels.length > 0 ? (
                                hotels.map(hotel => (
                                    <SearchItem key={hotel._id} hotel={hotel} />
                                ))
                            ) : (
                                <div className="empty-state-wrapper">
                                    <EmptyState
                                        title="找不到酒店資訊"
                                        description="很抱歉，我們無法找到相關的酒店資訊"
                                    />
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default HotelsList
