import { adminService } from '../services/admin'
import { useNotification } from '../hooks/useNotification'
import { useSession } from '../auth-client'
import { Bell } from "lucide-react";
import { useState } from 'react';


type FloatingSignalProps = {
  title?: string
  buttonText?: string
}

export default function ImpersonationBanner({
  title = 'Haluatko lopettaa session?',
  buttonText = 'Lopeta sessio'
}: FloatingSignalProps) {
  const { data: session } = useSession()

  const [isHovered, setIsHovered] = useState(false);
  const { showSuccess, showError } = useNotification()

  const description = `Olet käyttäjän ${session?.user?.name ?? 'tuntematon'} näkymässä`

  const handleStop = async () => {
    try {
      await adminService.stopImpersonating()
      showSuccess('Impersonointi lopetettu')
      // reload to pick up restored session
      window.location.reload()
    } catch (error: any) {
      showError(`Virhe lopetettaessa impersonointia: ${error?.message || error}`)
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
          ${isHovered ? "w-[320px] px-4 py-3" : "w-14 h-14"}
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
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-4 pointer-events-none"
            }
          `}
        >
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-slate-300">{description}</p>
        </div>

        {isHovered && (
          <button
            onClick={handleStop}
            className="ml-3 whitespace-nowrap rounded-lg bg-yellow-500 px-3 py-2 text-xs font-medium transition hover:bg-yellow-600"
          >
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
}
/* export const ImpersonationBanner = ({ onStopped }: { onStopped?: () => void }) => {
  const { showSuccess, showError } = useNotification()
  const { data: session } = useSession()

  const impersonatedName = session?.user?.name ?? undefined

  const handleStop = async () => {
    try {
      await adminService.stopImpersonating()
      showSuccess('Impersonointi lopetettu')
      onStopped?.()
      // reload to pick up restored session
      window.location.reload()
    } catch (error: any) {
      showError(`Virhe lopetettaessa impersonointia: ${error?.message || error}`)
    }
  }
  

  return (
    <div className="fixed right-1/3 top-0 z-50">
      <div className="bg-yellow-500 text-black p-3 rounded-sm shadow-lg w-72">
        <div className="font-semibold">Olet käyttäjän {impersonatedName} näkymässä</div>
        <div className="text-sm mt-1">Voit palata omaan tiliisi painamalla alla.</div>
        <button
          className="mt-3 bg-black text-white px-3 py-1 rounded-md text-sm"
          onClick={handleStop}
        >
          Lopeta impersonointi
        </button>
      </div>
    </div> 

  )
} */

//export default ImpersonationBanner
