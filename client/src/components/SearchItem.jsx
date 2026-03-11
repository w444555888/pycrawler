/*
 * @Author: w444555888 w444555888@yahoo.com.tw
 * @Date: 2024-07-17 20:28:18
 * @LastEditors: w444555888 w444555888@yahoo.com.tw
 * @LastEditTime: 2025-02-10 00:18:11
 * @FilePath: \my-app\src\components\SearchItem.jsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React, { useState } from 'react'
import "./searchItem.scss"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faThumbsUp } from '@fortawesome/free-solid-svg-icons'
import { useLocation, useNavigate } from 'react-router-dom'

const SearchItem =  React.memo(({ hotel }) => {
  const location = useLocation();
  const navigate = useNavigate();


  const handleHotelDetail = () => {
    navigate(`/hotels${location.search}&hotelId=${hotel._id}`, {
      state: { hotel },
    });
  };

  //SearchItem的active狀態
  const [addactive, setAddActive] = useState(false)
  const handleMouseEnter = () => { setAddActive(true) }
  const handleMouseLeave = () => { setAddActive(false) }


  return (
    <div className={`SearchItem ${addactive ? 'active' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}>

      <img className="itemImg" src={hotel.photos[0]} alt="" />
      <div className="itemInfo">
        <div className="infoTitle">
          <h2>
            {hotel.title}
          </h2>
          <div className='infoTitleRight'>
            傑出<br />
            {hotel.comments}則評論
            <button className='infoTitleRate'>
              {hotel.rating}
            </button>
          </div>
        </div>
        <div className="infoDes">
          <span className="far">{hotel.distance}</span>
          {hotel.popularHotel && (
            <>
              <span className="popular-icon">
                <FontAwesomeIcon icon={faThumbsUp} />
              </span>
            </>)}
          <div className="infoDetail">
            <div className="detailLeft">
              <div className="equipment">
                <b>標準雙人床－附獨立衛浴</b>
                <p>一張雙人床</p>
              </div>
              <div className="detailDes">
                <p>立即搶下優惠價－可取消</p>
                <b>此價格選項在本站僅剩 1 間</b>
              </div>
            </div>
            <div className="detailRight">
              <span className="optionDes">
                1晚、2位
              </span>
              {hotel?.cheapestPrice ? (
                <>
                  <span className="price">
                    TWD {hotel.cheapestPrice}
                  </span>
                  <span className="tax">
                    含稅費與其他費用
                  </span>
                  <button className="btn" onClick={handleHotelDetail}>
                    查看客房供應情況
                  </button>
                </>
              ) : (
                <button className="no-btn" disabled>
                  無客房供應情況
                </button>
              )}

            </div>
          </div>
        </div>
      </div>

    </div>

  )
})

export default SearchItem
