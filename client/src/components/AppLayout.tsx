import { Navbar } from './Navbar'
import { useSession } from '../auth-client'

export const AppLayout = ({
  children,
  showNavbar = true
}: {
  children: React.ReactNode
  showNavbar?: boolean
}) => {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-neutral-900 text-gray-100 flex justify-center">
      <div className="w-full max-w-sm p-4 pb-20 relative">
        {children}
        {session && showNavbar && <Navbar />}
      </div>
    </div>
  )
}
