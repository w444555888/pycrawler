/*
 * @Author: w444555888 w444555888@yahoo.com.tw
 * @Date: 2025-02-17 20:27:20
 * @LastEditors: w444555888 w444555888@yahoo.com.tw
 * @LastEditTime: 2025-03-20 21:03:12
 * @FilePath: \my-app\client\src\pages\SignUp.jsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import "./signUp.scss"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleRight } from '@fortawesome/free-solid-svg-icons'
import { request } from '../utils/apiService'
import { toast } from 'react-toastify'
const SignUp = () => {
    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const handleClickToHome = () => {
        navigate('/')
    }

    // 註冊
    const handleSignUp = async (e) => {
        e.preventDefault()
        const result = await request('POST', '/auth/register', { email, username, password }, setLoading)
        if (result.success) {
            navigate('/login')
        }else toast.error(`${result.message}`)
    }

    return (
        <div className='signUpWrapper'>
            <div className="signUpContainer">
                <div className="signUpTitle">
                    <div className="left">
                        <span className="logo">MIKE.BOOKING</span>
                    </div>
                    <div className="right">
                        <div className="navButton" onClick={handleClickToHome}><FontAwesomeIcon icon={faCircleRight} /></div>
                    </div>
                </div>
            </div>
            <div className="signUpContainer">
                <h2>Sign Up Account</h2>
                <form onSubmit={handleSignUp}>
                    <div className="formGroup">
                        <label htmlFor="email">E-mail;:</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="formGroup">
                        <label htmlFor="username">username:</label>
                        <input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="formGroup">
                        <label htmlFor="password">password:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Loading...' : 'Sign Up'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default SignUp
