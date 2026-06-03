import { Link } from 'react-router-dom'
import { useTeacherStudents } from '../hooks/useStudents'
import { StudentCard } from './StudentCard'
import { Plus } from 'lucide-react'

type Student = { 
  id: string; 
  name: string; 
  latestHomework: {
    practiceCount: number
  } | null
}

export const TeacherStudentsList = () => {
  const { data, isPending, isError } = useTeacherStudents()

  if (isPending) return <div>Ladataan oppilaita…</div>
  if (isError) return <div>Virhe ladattaessa oppilaita.</div>

  const list: Student[] = data?.students ?? []

  return (
    <div className="px-6 mt-4">
      <div className="grid grid-cols-2 gap-5">
        {list.map(s => (
          <StudentCard key={s.id} id={s.id} name={s.name} practiceCount={s.latestHomework?.practiceCount ?? 0} />
        ))}

          <Link
            to="/invite"
            className="relative rounded-md aspect-square w-full h-full overflow-hidden flex items-center justify-center bg-white cursor-pointer hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            aria-label="Invite a new student"
          >
            <Plus className="text-black w-8 h-8" aria-hidden="true" />
          </Link>
        </div>
      </div>
  )
}