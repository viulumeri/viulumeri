import { Link } from 'react-router-dom'
import { Plus, Check } from 'lucide-react'

type Props = {
  to?: string
  onClick?: () => void
  icon?: 'plus' | 'check'
  className?: string
}

export const FloatingActionButton = ({
  to,
  onClick,
  icon = 'plus',
  className = ''
}: Props) => {
  const Icon = icon === 'check' ? Check : Plus
  return (
    <div
      className={[
        'fixed left-0 right-0 z-40 flex items-center justify-center',
        'bottom-18',
        className
      ].join(' ')}
    >
      {to ? (
        <Link
          to={to}
          className="bg-white text-black rounded-full w-13 h-13 flex items-center justify-center border-black border-1"
        >
          <Icon size={28} strokeWidth={2.5} />
        </Link>
      ) : (
        <button
          onClick={onClick}
          className="bg-white text-black rounded-full w-13 h-13 flex items-center justify-center  border-black border-1"
        >
          <Icon size={28} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}
