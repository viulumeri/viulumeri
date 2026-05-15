import { useContext } from 'react'
import { NotificationContext } from '../contexts/NotificationContext'

export const useNotification = () => {
  const context = useContext(NotificationContext)
  
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }

  const { showNotification, dismissNotification, notification } = context

  return {
    notification,
    showSuccess: (message: string) => showNotification('success', message),
    showError: (message: string) => showNotification('error', message),
    dismissNotification
  }
}
