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

  const [isHovered, setIsHovered] = useState(false)
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
      // reload to pick up restored session
      window.location.reload()
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
      className="fixed bottom-6 right-6 z-[9999]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`
          flex items-center overflow-hidden rounded-full
          bg-yellow-900 text-white shadow-xl
          transition-all duration-300 ease-out
          ${isHovered ? 'w-[320px] px-4 py-3' : 'w-14 h-14'}
        `}
      >
        {/* Icon */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center">
          <Bell size={22} />
        </div>

        {/* Expanded content */}
        <div
          className={`
            ml-2 flex-1 transition-all duration-300
            ${
              isHovered
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-4 pointer-events-none'
            }
          `}
        >
          <h3 className="text-sm font-semibold">{currentTitle}</h3>
          <p className="text-xs text-slate-300">{description}</p>
        </div>

        {isHovered && (
          <button
            onClick={handleStop}
            className="ml-3 whitespace-nowrap rounded-lg bg-yellow-500 px-3 py-2 text-xs font-medium transition hover:bg-yellow-600"
          >
            {currentButtonText}
          </button>
        )}
      </div>
    </div>
  )
}
