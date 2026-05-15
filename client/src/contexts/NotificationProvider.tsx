import { useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import { NotificationContext, type Notification, type NotificationType } from './NotificationContext'

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notification, setNotification] = useState<Notification | null>(null)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const dismissNotification = useCallback(() => {
    setNotification(null)
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
  }, [timeoutId])

  const showNotification = useCallback((type: NotificationType, message: string) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    const newNotification: Notification = {
      id: Date.now().toString(),
      type,
      message
    }

    setNotification(newNotification)

    // Set auto-dismiss timer for 5 seconds
    const newTimeoutId = setTimeout(() => {
      setNotification(null)
      setTimeoutId(null)
    }, 5000)

    setTimeoutId(newTimeoutId)
  }, [timeoutId])

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [timeoutId])

  const value = {
    notification,
    showNotification,
    dismissNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
