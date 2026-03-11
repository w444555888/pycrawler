/*
 * @Author: w444555888 w444555888@yahoo.com.tw
 * @Date: 2024-07-17 20:28:18
 * @LastEditors: w444555888 w444555888@yahoo.com.tw
 * @LastEditTime: 2024-07-31 21:58:47
 * @FilePath: \my-app\client\src\subcomponents\Categories.jsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React from 'react'
import { useNavigate } from 'react-router-dom'
import "./categories.scss"
const Categories = ({ dataArray }) => {

  const navigate = useNavigate()

  const handleHotelClick = (item) => {
    navigate(`/hotels?hotelId=${item._id}`)
  }
  return (
    <div className='categories'>
      {dataArray.map((item, index) =>
        <div className="item"  key={item._id}   onClick={() => handleHotelClick(item)}>
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