import { useNotification } from '../hooks/useNotification'

export const NotificationBanner = () => {
  const { notification, dismissNotification } = useNotification()

  if (!notification) {
    return null
  }

  const isSuccess = notification.type === 'success'
  const isError = notification.type === 'error'

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 shadow-lg border-b-2 transition-all duration-300 ease-in-out animate-slide-down ${
        isSuccess
          ? 'bg-green-100 text-green-800 border-green-300'
          : isError
            ? 'bg-red-100 text-red-800 border-red-300'
            : ''
      }`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? undefined : 'polite'}
    >
      <div className="flex items-center gap-3 flex-1">
        {isSuccess && (
          <svg
            className="w-6 h-6 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
        {isError && (
          <svg
            className="w-6 h-6 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
        <span className="font-medium">{notification.message}</span>
      </div>
      <button
        onClick={dismissNotification}
        className={`ml-4 flex-shrink-0 inline-flex text-2xl font-bold leading-none hover:opacity-70 transition-opacity ${
          isSuccess ? 'text-green-600' : 'text-red-600'
        }`}
        aria-label="Sulje ilmoitus"
      >
        ×
      </button>
    </div>
  )
}
