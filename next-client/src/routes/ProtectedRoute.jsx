'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/redux/hooks'

export const ProtectedRoute = ({ children }) => {
  const router = useRouter()
  const { login } = useAppSelector((state) => state.user)

  useEffect(() => {
    if (!login) {
      router.push('/login')
    }
  }, [login, router])

  if (!login) {
    return null
  }

  return children
}