import { useState } from 'react'

const STORAGE_KEY = 'installPromptSeen'

type Props = {
  userId?: string
}

export const InstallPromptPopup = ({ userId }: Props) => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  )

  const onOk = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setDismissed(true)
  }

  if (isStandalone || dismissed || !userId) return null

  return (
    <div
      className="fixed inset-x-0 top-40 z-50 flex justify-center px-4 pointer-events-none"
      role="dialog"
      aria-label="Asenna sovellus"
    >
      <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-neutral-700 bg-neutral-800 text-neutral-100 shadow-2xl shadow-black/40">
        <div className="p-6">
            <h1 className="flex justify-center">Tervetuloa Viulumereen</h1>
            <h2 className="mt-5">Sovelluksen asennus</h2>
          <div className="mt-1 space-y-3 text-neutral-100/90">
            <p>
              Voit asentaa sovelluksen laitteellesi ja käyttää sitä kuin tavallista sovellusta
            </p>
            <div>
                <p className="font-semibold mb-1">Android</p>
                <div className="space-y-1 text-sm">
                    <p>1. Asenna joko:</p>
                    <p className="pl-4">a. automaattisen asennusilmoituksen kautta</p>
                    <p className="pl-4">b. selaimen valikon (⋮) kautta valitsemalla <span className="italic">Lisää aloitusnäyttöön</span></p>
                    <p>2. Paina <span className="italic">Asenna</span></p>
                </div>
            </div>
            <div>
              <p className="font-semibold mb-1">iPhone / iPad</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>
                    Teest
                </li>
                <li>
                  Asenna nappi
                </li>
              </ol>
            </div>
          </div>
            <button type="button" className="button-basic mx-auto mt-4" onClick={onOk}>
              OK
            </button>
        </div>
      </div>
    </div>
  )
}