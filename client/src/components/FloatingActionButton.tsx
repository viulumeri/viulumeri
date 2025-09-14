import { Link } from 'react-router-dom'
import { Plus, Check } from 'lucide-react'

type Props = {
  to: string
  icon?: 'plus' | 'check'
}

export const FloatingActionButton = ({ to, icon = 'plus' }: Props) => {
  const Icon = icon === 'check' ? Check : Plus

  return (
    <div className="fixed bottom-13 left-0 w-full h-16 bg-neutral-900 z-40 flex items-center justify-center pb-10">
      <Link
        to={to}
        className="bg-white text-black rounded-full w-12 h-12 flex items-center justify-center"
      >
        <Icon size={28} strokeWidth={2.5} />
      </Link>
    </div>
  )
}
