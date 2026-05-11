
import React from 'react'
import { useRouter } from 'next/navigation'
import "./categories.scss"
const Categories = ({ dataArray }) => {

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