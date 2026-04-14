
import React from 'react'
import { useNavigate } from 'react-router-dom'
import "./categories.scss"
const Categories = ({ dataArray }) => {

  const navigate = useNavigate()

  const handleHotelClick = (item) => {
    navigate(`/hotels?hotelId=${item.id}`)
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