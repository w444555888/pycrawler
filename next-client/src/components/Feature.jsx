
/**
 * Feature 组件 - 服务器组件
 * 
 * 在服务器端执行：
 *   - 可以直接访问数据库
 *   - 可以调用服务器间 API（快速）
 *   - 无法使用 React hooks (useState, useEffect)
 *   - 无法处理用户交互 (onClick 等)
 * 
 * 在浏览器端执行：
 *   - 接收来自服务器的数据（通过 props）
 *   - 处理用户交互
 *   - Categories 和 PopularHotels 是客户端组件
 */

import React from 'react'
import Categories from '@/components/subcomponents/Categories'
import PopularHotels from '@/components/subcomponents/PopularHotels'
import { serverRequest } from '@/utils/api/server'
import "./feature.scss"

/**
 * 异步服务器组件
 * 在服务器端执行，获取数据后渲染
 */
export default async function Feature() {
    // 在服务器端执行
    // 这里可以直接使用 async/await，不需要 useEffect
    
    let hotels = []
    let popularHotels = []

    try {
        // 获取所有酒店（用于分类）
        const hotelsResult = await serverRequest('GET', '/hotels', {})
        if (hotelsResult.success && hotelsResult.data) {
            hotels = hotelsResult.data
        }

        // 获取热门酒店
        const popularResult = await serverRequest('GET', '/hotels/popular', {})
        if (popularResult.success && popularResult.data) {
            popularHotels = popularResult.data
        }
    } catch (error) {
        console.error('Feature: Failed to fetch data', error)
        // 即使出错也继续渲染，只是显示空数据
    }

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