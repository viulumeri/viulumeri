import { Link } from 'react-router-dom'
import { Plus, Check } from 'lucide-react'

type Props = { to?: string; onClick?: () => void; icon?: 'plus' | 'check' }
export const FloatingActionButton = ({ to, onClick, icon = 'plus' }: Props) => {
  const Icon = icon === 'check' ? Check : Plus
  return (
    <div className="fixed left-0 right-0 bottom-20 z-40 flex items-center justify-center">
      {to ? (
        <Link
          to={to}
          className="bg-white text-black rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        >
          <Icon size={28} strokeWidth={2.5} />
        </Link>
      ) : (
        <button
          onClick={onClick}
          className="bg-white text-black rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        >
          <Icon size={28} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}
