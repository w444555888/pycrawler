
import React from 'react'
import { useRouter } from 'next/navigation'
import "./popularHotels.scss"
const PopularHotels = ({ dataArray }) => {

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