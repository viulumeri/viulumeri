import { useState } from 'react'
import BaselineAndroidIcon from '@iconify-react/ic/baseline-android'
import BaselineAppleIcon from '@iconify-react/ic/baseline-apple'
import IosIcon from '@iconify-react/simple-icons/ios'

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

  if ((isStandalone && !onClose) || (dismissed && !onClose) || (!userId && !onClose)) return null

  return (
  <div
    className="fixed inset-x-0 top-8 z-50 flex justify-center px-4 pointer-events-none"
    role="dialog"
    aria-label="Asenna sovellus"
  >
    <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-neutral-700 bg-neutral-800 text-neutral-100 shadow-2xl shadow-black/40">
      <div className="p-6 flex flex-col max-h-[82dvh]">

        <h1 className="text-center">Tervetuloa Viulumereen</h1>
        <h2 className="mt-5">Sovelluksen asennus</h2>
        <p className="mt-1 text-neutral-400 text-sm">
          Voit asentaa sovelluksen laitteellesi ja käyttää sitä kuin tavallista sovellusta
        </p>

        <div className="mt-4 overflow-y-auto min-h-0 flex-1">

          {showAndroid && (
            <div className="space-y-3">
              <p className="font-semibold flex items-center gap-2">
                <BaselineAndroidIcon className="w-8 h-8" /> Android
              </p>
              <p>1. Asenna joko:</p>
              <StepImage srcs={["/PWA-install-instructions/prompt.jpg"]} alts={["Asennusilmoitus"]}>
                <p className="pl-4 text-sm">a. automaattisen asennusilmoituksen kautta</p>
              </StepImage>
              <StepImage srcs={["/PWA-install-instructions/addtohomescreen.jpg", "/PWA-install-instructions/choose.jpg"]} alts={["Aloitusnäyttöön lisäys", "Valitse install"]}>
                <p className="pl-4 text-sm">b. selaimen valikon (⋮) kautta valitsemalla <span className="italic">Lisää aloitusnäyttöön</span></p>
              </StepImage>
              <StepImage srcs={["/PWA-install-instructions/prompt2.jpg"]} alts={["paina asenna"]}>
                <p>2. Paina <span className="italic">Asenna</span></p>
              </StepImage>
            </div>
          )}

          {showIos && (
            <div className="space-y-3">
              <p className="font-semibold flex items-center gap-2"> 
                <BaselineAppleIcon className="w-8 h-8" />
                <IosIcon className="w-8 h-8" />
                <span className="sr-only">iPhone / iPad</span>
              </p>
              <StepImage srcs={["/PWA-install-instructions/threedotsios.jpg"]} alts={["kolmepistevalikko"]}>
                <p className="pl-4 text-sm">1. Paina selaimen kolmepistevalikkoa näytön alareunassa</p>
              </StepImage>
              <StepImage srcs={["/PWA-install-instructions/shareios.jpg"]} alts={["Jaa-painike"]}>
                <p className="pl-4 text-sm">2. Paina Share / Jaa -painiketta</p>
              </StepImage>
              <StepImage srcs={["/PWA-install-instructions/addtohomeios.jpg"]} alts={["lisää aloitusnäyttöön"]}>
                <p className="pl-4 text-sm">3. Valitse "Add to Home Screen" / "Lisää aloitusnäyttöön"</p>
              </StepImage>
            </div>
          )}

        </div>
        
        <div className="shrink-0 pt-4">
          <p className="mt-5 text-sm text-neutral-400 text-center">
            Nämä ohjeet löytyvät myös asetuksista
          </p>
          
          <button type="button" className="button-basic mx-auto mt-4 flex justify-center" onClick={onOk}>
            OK
          </button>
        </div>

      </div>
    </div>
  </div>
)
}