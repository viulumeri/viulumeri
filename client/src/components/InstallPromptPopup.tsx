import { useState } from 'react'

const STORAGE_KEY = 'installPromptSeen'

const StepImage = ({ srcs, alts, children }: { srcs: string[]; alts: string[]; children: React.ReactNode }) => (
  <div>
    {children}
    <div className="mt-2 space-y-5">
      {srcs.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={alts[i]}
          className="rounded-lg w-full max-w-xs object-contain"
        />
      ))}
    </div>
  </div>
)

type Props = {
  userId?: string
  onClose?: () => void
  platform?: 'android' | 'ios'
}

const getPlatform = (): 'android' | 'ios' | undefined => {
  const ua = navigator.userAgent
  if (/android/i.test(ua)) return 'android'
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  return undefined
}

export const InstallPromptPopup = ({ userId, onClose, platform }: Props) => {
  const detectedPlatform = platform ?? getPlatform()
  const showAndroid = detectedPlatform === 'android' || !detectedPlatform
  const showIos = detectedPlatform === 'ios' || !detectedPlatform
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  )

  const onOk = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setDismissed(true)
    onClose?.()
  }

  if (isStandalone || (dismissed && !onClose) || (!userId && !onClose)) return null

  return (
    <div
      className="fixed inset-x-0 top-8 z-50 flex justify-center px-4 pointer-events-none "
      role="dialog"
      aria-label="Asenna sovellus"
    >
      <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-neutral-700 bg-neutral-800 text-neutral-100 shadow-2xl shadow-black/40">
        <div className="p-6 flex flex-col max-h-[85vh]">
            <h1 className="flex justify-center">Tervetuloa Viulumereen</h1>
            <h2 className="mt-5">Sovelluksen asennus</h2>
          <div className="mt-1 space-y-3 text-neutral-100/90 overflow-y-auto flex-1">
            <p>
              Voit asentaa sovelluksen laitteellesi ja käyttää sitä kuin tavallista sovellusta
            </p>

          {showAndroid && (
            <div>
              <p className="font-semibold mb-1">Android</p>
              <p>1. Asenna joko:</p>
              <StepImage srcs={["/PWA-install-instructions/prompt.jpg"]} alts={["Asennusilmoitus"]}>
                <p className="pl-4 text-sm">a. automaattisen asennusilmoituksen kautta</p>
              </StepImage>
              <StepImage srcs={["/PWA-install-instructions/addtohomescreen.jpg", "/PWA-install-instructions/choose.jpg"]} alts={["Aloitusnäyttöön lisäys", "Valitse install"]}>
                <p className="pl-4 text-sm mt-2">b. selaimen valikon (⋮) kautta valitsemalla <span className="italic">Lisää aloitusnäyttöön</span></p>
              </StepImage>
              <StepImage srcs={["/PWA-install-instructions/prompt2.jpg"]} alts={["paina asenna"]}>
                <p className="mt-2">2. Paina <span className="italic">Asenna</span></p>
              </StepImage>
            </div>
          )}

          {showIos && (
            <div>
              <p className="font-semibold mb-1">iPhone / iPad</p>
              <StepImage srcs={["/PWA-install-instructions/threedots.jpg"]} alts={["kolmepistevalikko"]}>
                <p className="pl-4 text-sm">1. Paina selaimen kolmepistevalikkoa näytön alareunassa</p>
              </StepImage>
              <StepImage srcs={["/PWA-install-instructions/share.jpg"]} alts={["Jaa-painike"]}>
                <p className="pl-4 text-sm mt-2">2. Paina Share / Jaa -painiketta (neliö, josta lähtee nuoli ylöspäin)</p>
              </StepImage>
              <StepImage srcs={["/PWA-install-instructions/addtohomeios.jpg"]} alts={["lisää aloitusnäyttöön"]}>
                <p className="pl-4 text-sm mt-2">3. Valitse "Add to Home Screen" / "Lisää aloitusnäyttöön"</p>
              </StepImage>
            </div>
          )}
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