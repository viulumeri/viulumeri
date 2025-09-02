import { Link } from 'react-router-dom'

type Props = {
  id: string
  name: string
}

export function StudentCard({ id, name }: Props) {
  return (
    <Link
      to={`/teacher/students/${id}/homework`}
      state={{ studentName: name }}
      className="relative rounded-md aspect-square w-full h-full overflow-hidden"
    >
      <h2 className="absolute bottom-4 left-6 text-white z-10">{name}</h2>
      <img
        src="https://images.metmuseum.org/CRDImages/ep/web-large/DT2145.jpg"
        alt="kuva"
        className="absolute inset-0 w-full h-full object-cover rounded-md z-0"
      />
    </Link>
  )
}
