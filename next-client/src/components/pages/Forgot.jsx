
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import "./forgot.scss"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleRight } from '@fortawesome/free-solid-svg-icons'
import { toast } from 'react-toastify'
import { request } from '@/utils/api/service';

const Forgot = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useRouter()
    const handleClickToLogin = () => {
        navigate.push('/login')
    }


    // 忘記密碼方送信箱
    const handleForgotPassword = async (e) => {
        e.preventDefault()
        const result = await request('POST', '/auth/forgot-password', { email }, setLoading);
        if (result.success) {
            toast.success('重置密碼鏈接已發送到您的郵箱');
        }else toast.error(`${result.message}`)
    };

    return (
        <div className='logInUpWrapper'>
            <div className="logInContainer">
                <div className="logInTitle">
                    <div className="left">
                        <span className="logo">MIKE.BOOKING</span>
                    </div>
                    <div className="right">
                        <div className="navButton" onClick={handleClickToLogin}><FontAwesomeIcon icon={faCircleRight} /></div>
                    </div>
                </div>
            </div>
            <div className="logInContainer">
                <h2>Forgot Account</h2>
                <form onSubmit={handleForgotPassword}>
                    <div className="formGroup">
                        <label htmlFor="email">Original E-mail:</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Loading...' : 'Send Reset Password Link to Email'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Forgot
