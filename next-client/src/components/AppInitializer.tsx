'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { logIn, logOut } from '@/redux/slices/userSlice'
import apiClient from '@/utils/api/client'
import { initSocket } from '@/utils/socket'

/**
 * 初始化应用的 Client Component
 * - 验证用户登录状态
 * - 初始化 Socket.io 连接
 */
export function AppInitializer() {
  const dispatch = useAppDispatch()
  const { login } = useAppSelector((state) => state.user)
  const pathname = usePathname()

  // 1. 仅在首次挂载且不在登录页时验证登录状态
  useEffect(() => {
    // 跳过登录和注册页面的验证
    if (pathname === '/login' || pathname === '/register') {
      return
    }

    const verifyLogin = async () => {
      try {
        const response = await apiClient.get('/auth/me')
        if (response.data?.success && response.data?.data) {
          dispatch(logIn())
        } else {
          dispatch(logOut())
        }
      } catch (error) {
        // 401 是正常的未登录状态，不需要频繁验证
        if (error instanceof Error && error.message !== 'Request failed with status code 401') {
          console.error('Auth verification failed:', error)
        }
        dispatch(logOut())
      }
    }

    verifyLogin()
  }, [pathname]) // 仅在路由改变时运行

  // 2. 当登录状态改变时，初始化 Socket.io
  useEffect(() => {
    if (login) {
      try {
        const socket = initSocket()
        return () => {
          // 清理 Socket 连接
          if (socket) {
            socket.disconnect()
          }
        }
      } catch (error) {
        console.error('Socket.io initialization failed:', error)
      }
    }
  }, [login])

  return null
}
