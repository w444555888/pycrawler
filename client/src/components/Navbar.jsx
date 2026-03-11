/*
 * @Author: w444555888 w444555888@yahoo.com.tw
 * @Date: 2024-07-17 20:28:18
 * @LastEditors: w444555888 w444555888@yahoo.com.tw
 * @LastEditTime: 2024-10-10 10:42:16
 * @FilePath: \my-app\src\components\Navbar.jsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React, { useState, useEffect } from 'react'
import "./navbar.scss"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSun, faMoon, faBed, faPlane, faShuttleVan, faUtensils, faMapMarkerAlt, faHeadset } from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useSelector } from 'react-redux'
import { toggleTheme } from '../redux/userStore'
const Navbar = () => {
    const [activeItem, setActiveItem] = useState('住宿')

    const navigate = useNavigate()
    const dispatch = useDispatch()

    // 拿到全局initialState數據
    const { login, theme } = useSelector((state) => state.user)


    const handleClickActive = (item) => {
        setActiveItem(item);

        const routes = {
            '航班': '/flight',
            '住宿': '/',
        };

        if (routes[item]) {
            navigate(routes[item]);
        }
    };

    

    const handleClickToHome = () => {
        navigate('/')
    }

    const handleClickToPersonal = () => {
        navigate('/personal')
    }

    // 切換主題白天/夜晚主題
    const toggleThemeHandler = () => {
        dispatch(toggleTheme())
    }

    // (夜晚主題)添加類dark-theme
    useEffect(() => {
        document.documentElement.className = theme === 'dark' ? 'dark-theme' : ''
    }, [theme])



    return (
        <div className='navbar'>
            <div className="navbarContainer">
                <div className="lineOne">
                    <button className="navButton" onClick={toggleThemeHandler}>
                        {theme === 'light' ? <FontAwesomeIcon icon={faSun} /> : <FontAwesomeIcon icon={faMoon} />}
                    </button>
                    <div className="left">
                        <span className="logo" onClick={handleClickToHome}>MIKE.BOOKING</span>
                    </div>
                    <div className="right">
                        {login ? (
                            <button className="navButton" onClick={handleClickToPersonal}>我的帳戶</button>
                        ) : <></>}

                    </div>
                </div>
                <div className="lineTwo">
                    <div className={`item ${activeItem === '住宿' ? 'navbar-active' : ''}`}
                        onClick={() => handleClickActive('住宿')}>
                        <FontAwesomeIcon icon={faBed} />
                        <span >住宿</span>
                    </div>
                    <div className={`item ${activeItem === '航班' ? 'navbar-active' : ''}`}
                        onClick={() => handleClickActive('航班')}>
                        <FontAwesomeIcon icon={faPlane} />
                        <span >航班</span>
                    </div>
                    <div className={`item ${activeItem === '機場接送' ? 'navbar-active' : ''}`}
                        onClick={() => handleClickActive('機場接送')}>
                        <FontAwesomeIcon icon={faShuttleVan} />
                        <span >機場接送</span>
                    </div>
                    <div className={`item ${activeItem === '美食預約' ? 'navbar-active' : ''}`}
                        onClick={() => handleClickActive('美食預約')}>
                        <FontAwesomeIcon icon={faUtensils} />
                        <span >美食預約</span>
                    </div>
                    <div className={`item ${activeItem === '行程活動 / 當地體驗' ? 'navbar-active' : ''}`}
                        onClick={() => handleClickActive('行程活動 / 當地體驗')}>
                        <FontAwesomeIcon icon={faMapMarkerAlt} />
                        <span >行程活動 / 當地體驗</span>
                    </div>
                    <div className={`item ${activeItem === '客服 / 幫助中心' ? 'navbar-active' : ''}`}
                        onClick={() => handleClickActive('客服 / 幫助中心')}>
                        <FontAwesomeIcon icon={faHeadset} />
                        <span >客服 / 幫助中心</span>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default Navbar