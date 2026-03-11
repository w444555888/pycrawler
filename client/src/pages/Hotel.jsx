import {
  faLocationDot,
  faPeopleGroup,
  faWifi,
  faGlassMartiniAlt,
  faDumbbell,
  faParking,
  faSwimmer,
  faUtensils,
  faSpa,
  faXmark,
  faAngleLeft,
  faAngleRight,
  faUserLarge,
  faCalendar,
  faCheck,
} from "@fortawesome/free-solid-svg-icons"
import {
  MdFreeBreakfast,
  MdRestaurantMenu,
  MdLocalParking,
} from "react-icons/md"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React, { useRef, useState, useEffect } from "react"
import Footer from "../components/Footer"
import Navbar from "../components/Navbar"
import { request } from "../utils/apiService"
import { gsap } from "gsap"
import "./hotel.scss"
import {
  useLocation,
  useParams,
  useSearchParams,
  useNavigate,
} from "react-router-dom"
import { DateRange } from "react-date-range"
import { subDays, differenceInDays, eachDayOfInterval, format, parseISO } from "date-fns"
import { useDispatch, useSelector } from "react-redux"
import {
  fetchSingleHotel,
  setCurrentHotel,
  setAvailableRooms,
} from "../redux/hotelStore"
import EmptyState from "../subcomponents/EmptyState"
import LeafletMapPicker from "../utils/LeafletMapPicker"


const Hotel = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const dispatch = useDispatch()
  const { currentHotel, availableRooms, loading, error } = useSelector(
    (state) => state.hotel
  )
  const [openSlider, setOpenSlider] = useState(false)
  const [sliderIndex, setSiderIndex] = useState(0)
  const [night, setNight] = useState("")
  const comments = useRef(null)



  // 從 URL 獲取參數
  const hotelId = searchParams.get("hotelId")
  const startDateParam = searchParams.get("startDate")
  const endDateParam = searchParams.get("endDate")

  // 路由傳遞數據
  const [openCalendar, setOpenCalendar] = useState(false)
  const [startDate, setStartDate] = useState(startDateParam || format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(endDateParam || format(new Date(Date.now() + 86400000 * 1), 'yyyy-MM-dd'));

  const [dates, setDates] = useState([
    {
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 1),
      key: "selection",
    },
  ])

  // 獲取酒店數據
  useEffect(() => {
    dispatch(fetchSingleHotel(searchParams))
  }, [searchParams, dispatch])

  // 晚數
  useEffect(() => {
    setNight(differenceInDays(dates[0].endDate, dates[0].startDate))
  }, [dates])

  const handleDateChange = (item) => {
    setDates([item.selection])
    setStartDate(format(item.selection.startDate, "yyyy-MM-dd"))
    setEndDate(format(item.selection.endDate, "yyyy-MM-dd"))
    if (
      item.selection.startDate &&
      item.selection.endDate &&
      format(item.selection.startDate, "yyyy-MM-dd") !==
      format(item.selection.endDate, "yyyy-MM-dd")
    ) {
      setOpenCalendar(false)
    }
  }

  const handleSearchHotels = () => {
    const params = {}
    if (hotelId) params.hotelId = hotelId
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    setSearchParams(params)
  }

  const handleHover = () => {
    gsap.to(comments.current, {
      css: {
        display: "flex",
        opacity: 1,
      },
      ease: "strong.inOut",
    })
  }

  const handleHoverExit = () => {
    gsap.to(comments.current, {
      css: {
        display: "none",
        opacity: 0,
      },
      ease: "strong.inOut",
    })
  }

  const clickSlider = (index) => {
    setOpenSlider(true)
    setSiderIndex(index)
  }

  const slideDirection = (direction) => {
    let newSliderIndex
    let lastPicutre = currentHotel.photos.length - 1
    if (direction === "left") {
      sliderIndex === 0
        ? (newSliderIndex = lastPicutre)
        : (newSliderIndex = sliderIndex - 1)
      setSiderIndex(newSliderIndex)
    } else {
      sliderIndex === lastPicutre
        ? (newSliderIndex = 0)
        : (newSliderIndex = sliderIndex + 1)
      setSiderIndex(newSliderIndex)
    }
  }

  const handleNavigateToOrder = async (roomId) => {
    navigate(`/order/${startDate}/${endDate}/${hotelId}/${roomId}`)
  }

  const facilitiesList = [
    { key: "bar", icon: faGlassMartiniAlt, label: "酒吧" },
    { key: "gym", icon: faDumbbell, label: "健身房" },
    { key: "parking", icon: faParking, label: "停車場" },
    { key: "pool", icon: faSwimmer, label: "游泳池" },
    { key: "restaurant", icon: faUtensils, label: "餐廳" },
    { key: "spa", icon: faSpa, label: "水療" },
    { key: "wifi", icon: faWifi, label: "免費無線網路" },
  ]


  // 房型的庫存資料，補齊日期區間內的所有日期
  const getFullInventory = (e, startDate, endDate) => {
    // endDate 減 1 天，因為退房日不算住宿
    const adjustedEnd = subDays(parseISO(endDate), 1)
    const allDates = eachDayOfInterval({
      start: parseISO(startDate),
      end: adjustedEnd,
    })

    return allDates.map((d) => {
      const dateStr = format(d, "yyyy-MM-dd");
      const found = e.inventory?.find((i) => {
        const invDateStr = format(new Date(i.date), "yyyy-MM-dd");
        return invDateStr === dateStr;
      });

      if (found) return { ...found, date: dateStr };

      return {
        date: dateStr,
        totalRooms: 0,
        bookedRooms: 0,
        remainingRooms: 0,
        missing: true,
      };
    });
  };

  if (!currentHotel)
    return (
      <div className="empty-state-container">
        <EmptyState
          title="找不到酒店資訊"
          description="很抱歉，我們無法找到相關的酒店資訊"
        />
      </div>
    )

  return (
    <div className="hotel">
      <Navbar />
      {openSlider && (
        <div className="slider">
          <div className="sliderWrapper">
            <div className="wrapperTitle">
              <div className="titleName">{currentHotel.name}</div>
              <span className="closeSign" onClick={() => setOpenSlider(false)}>
                關閉
                <FontAwesomeIcon icon={faXmark} />
              </span>
            </div>
            <div className="wrapperBody">
              <FontAwesomeIcon
                icon={faAngleLeft}
                className="arrow"
                onClick={() => slideDirection("left")}
              />
              <img src={currentHotel.photos[sliderIndex]} />
              <FontAwesomeIcon
                icon={faAngleRight}
                className="arrow"
                onClick={() => slideDirection("right")}
              />
            </div>
          </div>
        </div>
      )}
      <div className="hotelContainer">
        <div className="hotelWrapper">
          <div className="hotelHeaderBtn">
            <button>資訊 & 房價</button>
            <button>設施</button>
            <button>訂房須知</button>
            <button>房客評價</button>
          </div>
          <div className="hotelTitle">
            <div className="titleLeft">
              <span className="type">{currentHotel.type}</span>
              <span className="hotelName">{currentHotel.name}</span>
              <span className="recommend">
                <span className="recommendSvg">
                  <FontAwesomeIcon icon={faPeopleGroup} />
                </span>
                推薦四人住宿
              </span>
              <div className="address">
                <FontAwesomeIcon icon={faLocationDot} /> {currentHotel.address}{" "}
              </div>
            </div>
            <div className="titleRight">
              <button className="reservationBtn">現在就預訂</button>
            </div>
          </div>
          <div className="hotelImgWrapper">
            <div
              className="popupcomment"
              onMouseEnter={handleHover}
              onMouseOut={handleHoverExit}
            >
              <div className="commentInfo" ref={comments}>
                <button className="commentRate">{currentHotel.rating}</button>
                傑出
                <br />
                {currentHotel.comments}則評論
              </div>
            </div>
            <div className="hotelImg">
              {currentHotel.photos.map((e, index) => (
                <div
                  key={index}
                  className="Imgwrap"
                  onClick={() => clickSlider(index)}
                >
                  <img src={e} key={index} />
                </div>
              ))}
            </div>
          </div>
          <div className="hotelDes">
            <div className="hotelDesText">
              {currentHotel.title}
              <br />
              {currentHotel.desc}
              <h2>熱門設施</h2>
              <p className="textIcon">
                {facilitiesList.map(
                  (facility) =>
                    currentHotel.facilities[facility.key] && (
                      <React.Fragment key={facility.key}>
                        <FontAwesomeIcon
                          icon={facility.icon}
                          className="textIconItem"
                        />
                        {facility.label}
                      </React.Fragment>
                    )
                )}
              </p>
              <div className="hotelExtraSection">
                <div className="hotelLeft">
                  <h2>空房情況</h2>
                  <div className="hotelLeft-searchBarItem">
                    <FontAwesomeIcon
                      icon={faCalendar}
                      onClick={() => setOpenCalendar(!openCalendar)}
                    />
                    <span
                      className="searchText"
                      onClick={() => setOpenCalendar(!openCalendar)}
                    >
                      {format(dates[0].startDate, "MM/dd/yyyy")} -{" "}
                      {format(dates[0].endDate, "MM/dd/yyyy")}
                    </span>
                    {openCalendar && (
                      <DateRange
                        editableDateInputs={true}
                        onChange={handleDateChange}
                        moveRangeOnFirstSelection={false}
                        className="calendar"
                        ranges={dates}
                        minDate={new Date()}
                      />
                    )}
                  </div>
                  <div className="hotelLeft-listItem">
                    <button className="searchbtn" onClick={handleSearchHotels}>
                      搜尋
                    </button>
                  </div>
                </div>
                <div className="hotelRight">
                  <h2>飯店位置</h2>
                  <LeafletMapPicker
                    value={{
                      lat: currentHotel?.coordinates?.latitude || 10.2899,
                      lng: currentHotel?.coordinates?.longitude || 103.984,
                    }}
                    onChange={({ lat, lng }) => {
                      console.log("使用者選擇的座標:", lat, lng)
                    }}
                  />
                </div>
              </div>
            </div>
            <div></div>
            <div className="hotelDesBlock">
              <h2>住宿特色</h2>
              <p className="hotelDesBlockText">
                {format(dates[0].startDate, "MM/dd/yyyy")} -{" "}
                {format(dates[0].endDate, "MM/dd/yyyy")}
              </p>
              <p>
                入住 {night} 晚的最佳選擇！ 此住宿位於{currentHotel.city}
                的地區，地理位置評分高達 {currentHotel.rating} 分
                深受獨行旅客歡迎
              </p>
            </div>
          </div>
          <hr />
          {availableRooms && availableRooms.length > 0 && (
            <div className="roomDes">
              <div className="roomDesText">
                <table>
                  <thead>
                    <tr>
                      <th>客房類型</th>
                      <th>住客人數</th>
                      <th>每晚房價</th>
                      <th>房間數量</th>
                      <th>訂購須知</th>
                      <th>現在就預定</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableRooms.map((e) => {
                      const fullInventory = getFullInventory(e, startDate, endDate)
                      const allSoldOut = fullInventory.every(i => i.remainingRooms === 0);
                      const isSoldOut = fullInventory.some(i => i.remainingRooms === 0);
                      return fullInventory.map((inv, idx) => (
                        <tr key={`${e._id}-${inv.date}`}>
                          {/* 房型 */}
                          {idx === 0 && (
                            <td rowSpan={fullInventory.length} className="roomTitle">
                              {e.title} {e.roomType}
                              <br />
                              {e.desc.map((item, i) => (
                                <span key={i} className="desc">
                                  <FontAwesomeIcon icon={faCheck} className="iconCheck" />
                                  {item}
                                </span>
                              ))}
                            </td>
                          )}

                          {/* 可住人數 */}
                          {idx === 0 && (
                            <td rowSpan={fullInventory.length} className="roomPeople">
                              {Array.from({ length: e.maxPeople }).map((_, i) => (
                                <FontAwesomeIcon key={i} icon={faUserLarge} />
                              ))}
                            </td>
                          )}

                          {/* 每晚房價：顯示房況 */}
                          <td className="roomStatus">
                            <b>{inv.date}</b>

                          </td>

                          {/* 房間數量（空格佔位） */}
                          <td className="roomQty">{inv.missing ? (
                            <span className="status soldout">已滿房</span>
                          ) : (
                            <span className="status available">剩 {inv.remainingRooms} 間</span>
                          )}</td>

                          {/* 訂購須知（含總價與付款方式） */}
                          {idx === 0 && (
                            <td rowSpan={fullInventory.length} className="orderInfo">
                              <div className="price">
                                $TWD {e.roomTotalPrice}
                                <span className="price-note">包含稅費與其他費用</span>
                              </div>

                              <ul className="payment">
                                {e.paymentOptions.map((policy, i) => (
                                  <li key={i}>
                                    {policy.type}：{policy.description}
                                    <span className="refund">
                                      ({policy.refundable ? "可退款" : "不可退款"})
                                    </span>
                                  </li>
                                ))}
                              </ul>

                              <div className="service">
                                {e.service.breakfast && (
                                  <div>
                                    <MdFreeBreakfast className="service-item" /> 含早餐
                                  </div>
                                )}
                              </div>
                            </td>
                          )}

                          {/* 預定按鈕 */}
                          {idx === 0 && (
                            <td rowSpan={fullInventory.length} className="orderBtn">
                              <button
                                onClick={() => handleNavigateToOrder(e._id)}
                                disabled={isSoldOut || allSoldOut}
                                className={isSoldOut || allSoldOut ? "btn soldout" : "btn active"}
                              >
                                {allSoldOut
                                  ? "全部日期已滿房"
                                  : isSoldOut
                                    ? "日期部分已滿房"
                                    : "現在就預定"}
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Hotel
