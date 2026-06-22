import { getColorForStudent } from '../utils/studentcolors'
import { parseFirstLastName } from '../utils/nameUtils'
import { Link } from 'react-router-dom'

type Props = {
  id: string
  name: string
  practiceCount: number
}

export const StudentCard = ({ id, name, practiceCount }: Props) => {
  const bgColor = getColorForStudent(id)
  const { firstName, lastName } = parseFirstLastName(name)

  const maxDots = 5
  const visibleDots = Math.min(practiceCount, maxDots)
  const extraDots = practiceCount > maxDots ? practiceCount - maxDots : 0

  return (
    <Link
      to={`/teacher/students/${id}/homework`}
      state={{ studentName: name }}
      className="relative rounded-lg aspect-square w-full h-full overflow-hidden flex flex-col justify-between p-4"
      style={{ backgroundColor: bgColor }}
    >
      <div className="flex flex-wrap gap-1 items-center w-full">
        {Array.from({ length: visibleDots }).map((_, index) => (
          <span 
            key={index} 
            className="block w-4 h-4 rounded-full bg-white/95 outline outline-1 outline-black/40 shadow-xs"
          />
        ))}
        {extraDots > 0 && (
          <span className="text-base font-bold text-white/90 pl-0.5 leading-none [text-shadow:_1px_1px_0_rgba(0,0,0,0.4),_-1px_-1px_0_rgba(0,0,0,0.4),_1px_-1px_0_rgba(0,0,0,0.4),_-1px_1px_0_rgba(0,0,0,0.4)]">
            +{extraDots}
          </span>
        )}
      </div>

      <h3 className="grid grid-rows-2 w-full leading-tight mt-auto">
        <span className="truncate text-white font-bold [text-shadow:_1px_1px_0_rgba(0,0,0,0.4),_-1px_-1px_0_rgba(0,0,0,0.4),_1px_-1px_0_rgba(0,0,0,0.4),_-1px_1px_0_rgba(0,0,0,0.4)]">
          {firstName}
        </span>
        <span className="truncate text-white font-bold [text-shadow:_1px_1px_0_rgba(0,0,0,0.4),_-1px_-1px_0_rgba(0,0,0,0.4),_1px_-1px_0_rgba(0,0,0,0.4),_-1px_1px_0_rgba(0,0,0,0.4)]">
          {lastName}
        </span>
      </h3>
    </Link>
  )
}