import { Link, useLocation } from 'react-router-dom'
import { Users, Music, Settings } from 'lucide-react'

export const Navbar = () => {
  const location = useLocation()

  const isActive = (path: string) =>
    location.pathname === path ? 'text-white' : 'text-gray-500'

  return (
    <nav className="fixed bottom-0 w-full max-w-sm">
      <div className="mx-auto w-full max-w-sm">
        <div className="flex justify-around p-2">
          <Link
            to="/teacher/students"
            className={isActive('/teacher/students')}
          >
            <Users className="w-6 h-6" />
          </Link>
          <Link to="/songslist" className={isActive('/songslist')}>
            <Music className="w-6 h-6" />
          </Link>
          <Link to="#" className={isActive('/teacher/settings')}>
            <Settings className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </nav>
  )
}
