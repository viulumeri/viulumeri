import { createContext } from 'react'

export type NotificationType = 'success' | 'error'

export interface Notification {
  id: string
  type: NotificationType
  message: string
}

export interface NotificationContextValue {
  notification: Notification | null
  showNotification: (type: NotificationType, message: string) => void
  dismissNotification: () => void
}

export const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)
