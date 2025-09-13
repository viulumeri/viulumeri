import { Link, useLocation } from 'react-router-dom'
import { Users, Music, Settings } from 'lucide-react'

export const Navbar = () => {
  const location = useLocation()

  const isActive = (path: string) =>
    location.pathname === path ? 'text-white' : 'text-gray-500'

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 z-50 bg-neutral-900">
      <div className="mx-auto w-full max-w-sm h-full flex items-center justify-around">
        <Link to="/teacher/students" className={isActive('/teacher/students')}>
          <Users className="w-6 h-6" />
        </Link>
        <Link to="/songslist" className={isActive('/songslist')}>
          <Music className="w-6 h-6" />
        </Link>
        <Link to="/settings" className={isActive('/settings')}>
          <Settings className="w-6 h-6" />
        </Link>
      </div>
    </nav>
  )
}
