
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import "./popularHotels.scss"

/**
 * PopularHotels 组件 - 客户端组件
 * 作用：展示热门酒店卡片，处理导航点击
 * 
 * Props: dataArray - 酒店数组（来自服务器父组件）
 */
const PopularHotels = ({ dataArray = [] }) => {

    const navigate = useRouter()

    const handleHotelClick = (item) => {
        navigate.push(`/hotels?hotelId=${item.id}`)
    }
    return (
        <div className='popularHotels'>
            {dataArray.map((item, index) =>
                <div className="item" key={item.id} onClick={() => handleHotelClick(item)}>
                    <img src={item.photos[0]} />
                    <div className="itemInfo">
                        <div className="title">
                            {item.title}
                        </div>
                        <div className="subTitle">
                            {item.city}
                        </div>
                        <div className="rate">
                            <button>{item.rating}</button>
                            <span>{item.rate >= 9.5 ? "超高分" : "很棒"}</span>
                            <p>{item.comments}則評論</p>
                        </div>
                    </div>
                </div>)}
        </div>
    )
}

export default PopularHotels