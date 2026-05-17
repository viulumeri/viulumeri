import { useContext, useCallback } from 'react'
import { NotificationContext } from '../contexts/NotificationContext'

export const useNotification = () => {
  const context = useContext(NotificationContext)
  
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }

  const { showNotification, dismissNotification, notification } = context

  const showSuccess = useCallback(
    (message: string) => showNotification('success', message),
    [showNotification]
  )

  const showError = useCallback(
    (message: string) => showNotification('error', message),
    [showNotification]
  )

  return {
    notification,
    showSuccess,
    showError,
    dismissNotification
  }
}
