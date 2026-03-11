import React, { useState, useEffect } from 'react'
import './header.scss'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import DateRangePicker from './DateRangePicker'
import ConditionSelector from './ConditionSelector'
import { request } from '../utils/apiService'

const Header = () => {
  const [destination, setDestination] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [openDate, setOpenDate] = useState(false)
  const [openOptions, setOpenOptions] = useState(false)
  const [dates, setDates] = useState([
    {
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 1),
      key: 'selection',
    },
  ])
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(Date.now() + 86400000 * 1), 'yyyy-MM-dd'));
  const [conditions, setConditions] = useState({ adult: 1, room: 1 })

  const navigate = useNavigate()

  const handleSearch = () => {
    setShowSuggestions(false)
    navigate(
      `/hotelsList?name=${destination}&startDate=${startDate}&endDate=${endDate}&adult=${conditions.adult}&room=${conditions.room}`
    )
  }

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (destination.trim() === '') {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      const res = await request('GET', '/hotels/suggestions', { name: destination })
      if (res.success) {
        setSuggestions(res.data)
        setShowSuggestions(true)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [destination])

  const handleSuggestionClick = (suggestionName) => {
    setDestination(suggestionName)
    setShowSuggestions(false)
  }

  return (
    <div className="header">
      <div className="headerContainer">
        <div className="headerList">
          <div className="headerSearch">
            <div className="headerSearchItem suggestion-wrapper">
              <input
                type="text"
                placeholder="目的地/住宿名稱"
                className="headerSearchInput"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true)
                }}
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="suggestion-list">
                  {suggestions.map((item) => (
                    <li key={item._id} onClick={() => handleSuggestionClick(item.name)}>
                      {item.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="headerSearchItem">
              <span onClick={() => setOpenDate(!openDate)} className="headerSearchText">
                {`${format(dates[0].startDate, 'MM/dd/yyyy')} 到 ${format(dates[0].endDate, 'MM/dd/yyyy')}`}
              </span>
              {openDate && (
                <DateRangePicker
                  dates={dates}
                  setDates={setDates}
                  setStartDate={setStartDate}
                  setEndDate={setEndDate}
                  onClose={() => setOpenDate(false)}
                />
              )}
            </div>

            <div className="headerSearchItem">
              <span onClick={() => setOpenOptions(!openOptions)} className="headerSearchText">
                {`${conditions.adult} 位成人 · ${conditions.room} 間房`}
              </span>
              {openOptions && (
                <ConditionSelector
                  conditions={conditions}
                  setConditions={setConditions}
                />
              )}
            </div>

            <div className="headerSearchItem">
              <button className="headerBtn" onClick={handleSearch}>
                搜尋
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
