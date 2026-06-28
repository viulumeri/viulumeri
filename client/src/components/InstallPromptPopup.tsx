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
      className="fixed inset-x-4 isolate z-[10000] flex flex-col rounded-2xl border border-neutral-700 bg-neutral-800 text-neutral-100 shadow-2xl shadow-black/40"
      style={{
        top: 'max(1rem, env(safe-area-inset-top, 0px))',
        maxHeight: 'calc(100dvh - max(1rem, env(safe-area-inset-top, 0px)) - max(7rem, calc(6rem + env(safe-area-inset-bottom, 0px))))',
        bottom: 'max(7rem, calc(6rem + env(safe-area-inset-bottom, 0px)))',
        maxWidth: '42rem',
        marginInline: 'auto',
      }}
      role="dialog"
      aria-label="Asenna sovellus"
    >

      {/* Scrollable content */}
      <div className="overflow-y-auto flex-1 p-6 pb-0 min-h-0">

        <h1 className="text-center">Tervetuloa Viulumereen</h1>
        <h2 className="mt-5">Sovelluksen asennus</h2>
        <p className="mt-1 text-neutral-400 text-sm">
          Voit asentaa sovelluksen laitteellesi ja käyttää sitä kuin tavallista sovellusta
        </p>

        <div className="mt-4 space-y-3 text-neutral-100/90">

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

        <p className="mt-6 mb-4 text-sm text-neutral-400 text-center">
          Nämä ohjeet löytyvät myös asetuksista
        </p>

      </div>

      {/* OK button is outside scroll area and always reachable */}
      <div className="relative z-10 shrink-0 px-6 py-4 border-t border-neutral-700 flex justify-center bg-neutral-800">
        <button
          type="button"
          className="flex min-h-16 min-w-40 items-center justify-center bg-transparent px-3 py-2 text-black"
          onClick={onOk}
          aria-label="Sulje asennusohje"
        >
          <span className="button-basic pointer-events-none flex min-h-[3rem] min-w-28 items-center justify-center px-10">
            OK
          </span>
        </button>
      </div>

    </div>
  )
}
