import { useState } from 'react'

const STORAGE_KEY = 'installPromptSeen'

const StepImage = ({ srcs, alts, children }: { srcs: string[]; alts: string[]; children: React.ReactNode }) => {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span>{children}</span>
        <button
          type="button"
          className="text-xs text-blue-400 underline whitespace-nowrap shrink-0"
          onClick={() => setOpen(o => !o)}
        >
          {open ? '▲ piilota' : '▼ kuva'}
        </button>
      </div>
      {open && (
        <div className="mt-2 flex overflow-x-auto gap-2">
          {srcs.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={alts[i]}
              className="rounded-lg h-64 w-auto shrink-0 object-contain"
            />
          ))}
        </div>
      )}
    </div>
  )
}

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
      className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 pointer-events-none"
      role="dialog"
      aria-label="Asenna sovellus"
    >
      <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-neutral-700 bg-neutral-800 text-neutral-100 shadow-2xl shadow-black/40">
        <div className="p-6">
            <h1 className="flex justify-center">Tervetuloa Viulumereen</h1>
            <h2 className="mt-5">Sovelluksen asennus</h2>
          <div className="mt-1 space-y-3 text-neutral-100/90 overflow-y-auto max-h-[60vh]">
            <p>
              Voit asentaa sovelluksen laitteellesi ja käyttää sitä kuin tavallista sovellusta
            </p>
            <div>
                <p className="font-semibold mb-1">Android</p>
                <p>1. Asenna joko:</p>
                <div className="flex items-start gap-2">
                  <StepImage srcs={["/PWA-install-instructions/prompt.jpg"]} alts={["Asennusilmoitus"]}>
                  <p className="pl-4 text-sm">a. automaattisen asennusilmoituksen kautta</p>
                  </StepImage>
                </div>
                <div className="flex items-start gap-2 mt-2">
                  <StepImage srcs={["/PWA-install-instructions/addtohomescreen.jpg", "/PWA-install-instructions/choose.jpg"]} alts={["Aloitusnäyttöön lisäys", "Valitse install"]}>
                  <p className="pl-4 text-sm">b. selaimen valikon (⋮) kautta valitsemalla <span className="italic">Lisää aloitusnäyttöön</span></p>
                  </StepImage>
                </div>
                <div className="flex gap-10 mt-2">
                  <StepImage srcs={["/PWA-install-instructions/prompt2.jpg"]} alts={["paina asenna"]}>
                  <p className="mt-2">2. Paina <span className="italic">Asenna</span></p>
                  </StepImage>
                </div>
            </div>
            <div>
              <p className="font-semibold mb-1">iPhone / iPad</p>
              <div className="flex items-start gap-2">
                <StepImage srcs={["/PWA-install-instructions/threedots.jpg"]} alts={["kolmepistevalikko"]}>
                <p className="pl-4 text-sm">1. Paina selaimen kolmepistevalikkoa näytön alareunassa</p>
                </StepImage>
              </div>
              <div className="flex items-start gap-2 mt-2">
                <StepImage srcs={["/PWA-install-instructions/share.jpg"]} alts={["Jaa-painike"]}>
                  <p className="pl-4 text-sm">2. Paina Share / Jaa -painiketta (neliö, josta lähtee nuoli ylöspäin)</p>
                </StepImage>
              </div>
              <div className="flex items-start gap-2 mt-2">
                <StepImage srcs={["/PWA-install-instructions/addtohomeios.jpg"]} alts={["lisää aloitusnäyttöön"]}>
                  <p className="pl-4 text-sm">3. Valitse "Add to Home Screen" / "Lisää aloitusnäyttöön"</p>
                </StepImage>
              </div>
            </div>
          </div>
            <p className="mt-5"> Nämä ohjeet löytyvät myös asetuksista</p>
            <button type="button" className="button-basic mx-auto mt-4" onClick={onOk}>
              OK
            </button>
        </div>
      </div>
    </div>
  )
}