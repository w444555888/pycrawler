
import React, { useState } from 'react'
import { request } from '../utils/apiService';
import "./resetPassword.scss"
import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
const ResetPassword = () => {
  const { token } = useParams() // 從 URL 中獲取 token
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false);

  // 重置密碼
  const handlePasswordReset = async (e) => {
    e.preventDefault()
    const result = await request('POST', `/auth/reset-password/${token}`, { password: newPassword }, setLoading);
    if (result.success) {
      toast.success('密碼重置成功');
    } else toast.error(`${result.message}`)
  }

  return (
    <div className='resetWrapper'>
      <div className='resetContainer'>
        <h2 className='resetTitle'>重置密碼</h2>
        <form onSubmit={handlePasswordReset}>
          <div>
            <label htmlFor="password">新密碼：</label>
            <input
              type="password"
              id="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className='navButton'
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : '提交新密碼'}
          </button>
        </form>
      </div>

    </div>
  )
}

export default ResetPassword
