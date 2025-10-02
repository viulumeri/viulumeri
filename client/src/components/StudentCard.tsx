import { getColorForStudent } from '../utils/studentcolors'
import { Link } from 'react-router-dom'

type Props = {
  id: string
  name: string
}

export const StudentCard = ({ id, name }: Props) => {
  const bgColor = getColorForStudent(id)
  const spaceIndex = name.indexOf(' ')
  const firstName = spaceIndex !== -1 ? name.substring(0, spaceIndex) : name
  const lastName = spaceIndex !== -1 ? name.substring(spaceIndex + 1) : ''

  return (
    <Link
      to={`/teacher/students/${id}/homework`}
      state={{ studentName: name }}
      className={`relative rounded-lg aspect-square w-full h-full overflow-hidden flex items-end p-4`}
      style={{ backgroundColor: bgColor }}
    >
      <h3 className="grid grid-rows-2 w-full leading-tight">
        <span className="truncate">{firstName}</span>
        <span className="truncate">{lastName}</span>
      </h3>
    </Link>
  )
}
