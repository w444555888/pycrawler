
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import "./categories.scss"

/**
 * Categories 组件 - 客户端组件
 * 作用：展示酒店分类卡片，处理导航点击
 * 
 * Props: dataArray - 酒店数组（来自服务器父组件）
 */
const Categories = ({ dataArray = [] }) => {

  const navigate = useRouter()

  const handleHotelClick = (item) => {
    navigate.push(`/hotels?hotelId=${item.id}`)
  }
  return (
    <div className='categories'>
      {dataArray.map((item, index) =>
        <div className="item"  key={item.id}   onClick={() => handleHotelClick(item)}>
          <img src={item.photos[0]} />
          <div className="itemInfo">
            <div className="title">
              {item.name}
            </div>
            <div className="subTitle">
              {item.city}
            </div>
          </div>
        </div>)}
    </div>
  )
}

export default Categories