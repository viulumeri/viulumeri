import { adminService } from '../services/admin'
import { useNotification } from '../hooks/useNotification'
import { useSession } from '../auth-client'
import { Bell } from 'lucide-react'
import { useState } from 'react'
import {
  disableAdminRegularUserView,
  isAdminRegularUserViewEnabled
} from '../utils/adminRegularUserView'
import type { AppSessionUser } from '../../../shared/types'


type FloatingSignalProps = {
  title?: string
  buttonText?: string
}


export default function ImpersonationBanner({
  title = 'Haluatko lopettaa session?',

  buttonText = 'Lopeta sessio'

}: FloatingSignalProps) {
  const { data: session } = useSession()
  const role = (session?.user as AppSessionUser | undefined)?.role
  const isImpersonating = Boolean(
    session && (session.session as Record<string, unknown>)?.impersonatedBy
  )
  const isAdminRegularUserView =
    role === 'admin' && isAdminRegularUserViewEnabled()

  const [isExpanded, setIsExpanded] = useState(false)
  const { showSuccess, showError } = useNotification()

  const description = isImpersonating
    ? `Olet käyttäjän ${session?.user?.name ?? 'tuntematon'} näkymässä`
    : 'Olet tavallisessa käyttäjänäkymässä'

  const currentTitle = isAdminRegularUserView
    ? 'Palaa ylläpitonäkymään?'
    : title

  const currentButtonText = isAdminRegularUserView
    ? 'Palaa adminiin'
    : buttonText

  const handleStop = async () => {
    if (isAdminRegularUserView && !isImpersonating) {
      disableAdminRegularUserView()
      showSuccess('Palattu ylläpitonäkymään')
      window.location.href = '/admin'
      return
    }

    try {
      await adminService.stopImpersonating()
      showSuccess('Impersonointi lopetettu')
      window.location.href = '/admin'
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message?: unknown }).message)
          : String(error)
      showError(`Virhe lopetettaessa impersonointia: ${message}`)
    }
  }
  return (
    <div
      className="fixed inset-x-4 bottom-20 z-[9999] flex justify-end sm:inset-x-auto sm:bottom-6 sm:right-6"
    >
      <div
        className={`
          flex items-center overflow-hidden
          bg-yellow-900 text-white shadow-xl
          transition-all duration-300 ease-out
          ${
            isExpanded
              ? 'w-full flex-wrap rounded-2xl px-3 py-2 sm:w-[320px] sm:flex-nowrap sm:rounded-full sm:px-4 sm:py-3'
              : 'h-14 w-14 rounded-full'
          }
        `}
      >
        <button
          type="button"
          aria-label="Session hallinta"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded(current => !current)}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
        >
          <Bell size={22} />
        </button>

        <div
          className={`
            ml-2 min-w-0 flex-1 transition-all duration-300
            ${
              isExpanded
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-4 pointer-events-none'
            }
          `}
        >
          <h3 className="text-sm font-semibold">{currentTitle}</h3>
          <p className="text-xs text-slate-300">{description}</p>
        </div>

        {isExpanded && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              void handleStop()
            }}
            className="mt-2 w-full basis-full rounded-lg bg-yellow-500 px-3 py-2 text-xs font-medium transition hover:bg-yellow-600 sm:ml-3 sm:mt-0 sm:w-auto sm:basis-auto sm:shrink-0 sm:whitespace-nowrap"
          >
            {currentButtonText}
          </button>
        )}
      </div>
    </div>
  )
}
