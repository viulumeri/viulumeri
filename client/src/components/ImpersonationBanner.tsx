import React from 'react'
import { adminService } from '../services/admin'
import { useNotification } from '../hooks/useNotification'

export const ImpersonationBanner = ({ onStopped }: { onStopped?: () => void }) => {
  const { showSuccess, showError } = useNotification()

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
    <div className="fixed right-4 top-1/4 z-50">
      <div className="bg-yellow-500 text-black p-3 rounded-lg shadow-lg w-64">
        <div className="font-semibold">Olet impersonoinut käyttäjää</div>
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
}

export default ImpersonationBanner
