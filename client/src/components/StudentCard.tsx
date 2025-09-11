import { getColorForStudent } from '../utils/studentcolors'
import { Link } from 'react-router-dom'

type Props = {
  id: string
  name: string
}

export function StudentCard({ id, name }: Props) {
  const bgColor = getColorForStudent(id)
  return (
    <Link
      to={`/teacher/students/${id}/homework`}
      state={{ studentName: name }}
      className={`relative rounded-lg aspect-square w-full h-full overflow-hidden flex items-end p-4`}
      style={{ backgroundColor: bgColor }}
    >
      <h2 className=" ">{name}</h2>
    </Link>
  )
}
