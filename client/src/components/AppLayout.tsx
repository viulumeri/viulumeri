import { Navbar } from './Navbar'
import { useSession } from '../auth-client'
import ImpersonationBanner from './ImpersonationBanner'
import { isAdminRegularUserViewEnabled } from '../utils/adminRegularUserView'
import type { AppSessionUser } from '../../../shared/types'

export const AppLayout = ({
  children,
  showNavbar = true,
  fullWidth = false
}: {
  children: React.ReactNode
  showNavbar?: boolean
  fullWidth?: boolean
}) => {
  const { data: session } = useSession()
  const role = (session?.user as AppSessionUser | undefined)?.role

  const isImpersonating = Boolean(
    session && (session.session as Record<string, unknown>)?.impersonatedBy
  )
  const isAdminRegularUserView =
    role === 'admin' && isAdminRegularUserViewEnabled()

  return (
    <div className="min-h-screen bg-neutral-900 text-gray-100 flex justify-center">
      <div className={`w-full flex flex-col flex-grow relative ${fullWidth ? '' : 'max-w-4xl'}`}>
        {children}
        {session && showNavbar && <Navbar />}
        {(isImpersonating || isAdminRegularUserView) && <ImpersonationBanner />}
      </div>
    </div>
  )
}
