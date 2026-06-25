import { Link, useLocation } from 'react-router-dom'
import { Users, Music, Settings, BookOpenText, Banana } from 'lucide-react'
import { useSession } from '../auth-client'
import type { AppSessionUser } from '../../../shared/types'
import { isAdminRegularUserViewEnabled } from '../utils/adminRegularUserView'

export const Navbar = () => {
  const location = useLocation()
  const { data: session } = useSession()
  const userType = (session?.user as AppSessionUser | undefined)?.userType
  const role = (session?.user as AppSessionUser | undefined)?.role
  const isAdminRegularUserView =
    role === 'admin' && isAdminRegularUserViewEnabled()

  const isActive = (path: string) =>
    location.pathname === path ? 'text-white' : 'text-gray-500'

  const lastRoute =
    localStorage.getItem('studentLastHomeworkRoute') || '/student/homework'

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 z-50 bg-neutral-900">
      <div className="mx-auto w-full max-w-4xl h-full flex items-center gap-2 px-6 pb-4">
        {role === 'admin' && !isAdminRegularUserView && (
          <>
            <Link to="/admin" className={`flex-1 flex justify-center ${isActive('/admin')}`}>
              <Banana className="w-6 h-6" />
            </Link>
          </>
        )}
        {userType === 'teacher' && (
          <Link
            to="/teacher/students"
            className={`flex-1 flex justify-center ${isActive('/teacher/students')}`}
          >
            <Users className="w-6 h-6" />
          </Link>
        )}

        {userType === 'student' && (
          <Link
            to={lastRoute}
            className={`flex-1 flex justify-center ${
              location.pathname.startsWith('/student/homework')
                ? 'text-white'
                : 'text-gray-500'
            }`}
          >
            <BookOpenText className="w-6 h-6" />
          </Link>
        )}
        <Link to="/songslist" className={`flex-1 flex justify-center pl-3 ${isActive('/songslist')}`}>
          <Music className="w-6 h-6" />
        </Link>
        <Link to="/settings" className={`flex-1 flex justify-center pl-3 ${isActive('/settings')}`}>
          <Settings className="w-6 h-6" />
        </Link>
      </div>
    </nav>
  )
}
