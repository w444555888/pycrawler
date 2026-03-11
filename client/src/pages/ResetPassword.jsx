/*
 * @Author: w444555888 w444555888@yahoo.com.tw
 * @Date: 2024-10-10 12:40:41
 * @LastEditors: w444555888 w444555888@yahoo.com.tw
 * @LastEditTime: 2024-10-10 13:28:28
 * @FilePath: \my-app\client\src\pages\ResetPassword.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
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
