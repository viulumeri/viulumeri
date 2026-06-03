import { Navbar } from './Navbar'
import { useSession } from '../auth-client'
import ImpersonationBanner from './ImpersonationBanner'

export const AppLayout = ({
  children,
  showNavbar = true
}: {
  children: React.ReactNode
  showNavbar?: boolean
}) => {
  const { data: session } = useSession()

  const isImpersonating = Boolean(
    session && (session.session as Record<string, unknown>)?.impersonatedBy
  )

  return (
    <div className="min-h-screen bg-neutral-900 text-gray-100 flex justify-center">
      <div className="w-full max-w-4xl flex flex-col flex-grow relative">
        {children}
        {session && showNavbar && <Navbar />}
        {isImpersonating && <ImpersonationBanner />}
      </div>
    </div>
  )
}
