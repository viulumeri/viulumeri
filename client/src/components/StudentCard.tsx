import { getColorForStudent } from '../utils/studentcolors'
import { parseFirstLastName } from '../utils/nameUtils'
import { Link } from 'react-router-dom'

type Props = {
  id: string
  name: string
}

export const StudentCard = ({ id, name }: Props) => {
  const bgColor = getColorForStudent(id)
  const { firstName, lastName } = parseFirstLastName(name)

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
