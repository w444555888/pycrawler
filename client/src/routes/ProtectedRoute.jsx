import React from 'react'
import { Navigate } from 'react-router-dom'
import { ROUTES } from './routes'

export const ProtectedRoute = ({ element, login }) => {
  return login ? element : <Navigate to={ROUTES.LOGIN} replace />
}