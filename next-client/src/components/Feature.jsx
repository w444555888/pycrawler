
'use client'

import React, { useState, useEffect } from 'react'
import Categories from '@/components/subcomponents/Categories'
import PopularHotels from '@/components/subcomponents/PopularHotels'
import { request } from '@/utils/api/service'
import { toast } from 'react-toastify' 
import "./feature.scss"
const Feature = () => {
    const [hotels, setHotels] = useState([])
    const [popularHotels, setPopularHotels] = useState([])

    useEffect(() => {
        const fetchHotels = async () => {
            const result = await request('GET', '/hotels', {});
            if (result.success) {
                setHotels(result.data);
            }else toast.error(`${result.message}`)
        };

        const fetchPopularHotels = async () => {
            const result = await request('GET', '/hotels/popular', {});
            if (result.success) {
                setPopularHotels(result.data);
            }else toast.error(`${result.message}`)
        };

        fetchHotels();
        fetchPopularHotels();
    }, []);


    return (
        <div className='feature'>
            <div className="container">
                <div className="listTitle">
                    <span>依住宿類型瀏覽</span>
                </div>
                <div className="listItems">
                    <Categories dataArray={hotels} />
                </div>

                <div className="listTitle">
                    <span>近期受歡迎飯店</span>
                </div>
                <div className="listItems">
                    <PopularHotels dataArray={popularHotels} />
                </div>
            </div>
        </div>
    )
}

export default Feature