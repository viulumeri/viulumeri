import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import type { ReactNode } from 'react'
import { NotificationContext, type Notification, type NotificationType } from './NotificationContext'

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notification, setNotification] = useState<Notification | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismissNotification = useCallback(() => {
    setNotification(null)
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const showNotification = useCallback((type: NotificationType, message: string) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      type,
      message
    }

    setNotification(newNotification)
  }, [])

  // Auto-dismiss effect - runs when notification changes
  useEffect(() => {
    if (!notification) {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    // Clear any existing timeout
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout for auto-dismiss after 5 seconds
    timeoutRef.current = setTimeout(() => {
      setNotification(null)
      timeoutRef.current = null
    }, 5000)

    // Cleanup function
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [notification])

  const value = useMemo(() => ({
    notification,
    showNotification,
    dismissNotification
  }), [notification, showNotification, dismissNotification])

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
