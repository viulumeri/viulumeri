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
    <div className="min-h-screen bg-neutral-900 text-gray-100 flex flex-col">
      <div className="w-full flex flex-col flex-grow relative">{children}</div>
      {session && showNavbar && <Navbar />}
    </div>
  )
}
