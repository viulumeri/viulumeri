import { useNavigate } from 'react-router-dom'
import { useTeacherStudents } from '../hooks/useStudents'
import { StudentCard } from './StudentCard'
import { Plus } from 'lucide-react'

type Student = { id: string; name: string }

export const TeacherStudentsList = () => {
  const { data, isPending, isError } = useTeacherStudents()
  const navigate = useNavigate()

  if (isPending) return <div>Ladataan oppilaita…</div>
  if (isError) return <div>Virhe ladattaessa oppilaita.</div>

  const list: Student[] = data?.students ?? []

  return (
    <div className="px-6 mt-4">
      <div className="grid grid-cols-2 gap-5">
        {list.map(s => (
          <StudentCard key={s.id} id={s.id} name={s.name} />
        ))}

        <div
          className="relative rounded-md aspect-square w-full h-full overflow-hidden flex items-center justify-center bg-white"
          onClick={() => navigate('/invite')}
        >
          <Plus className="text-black w-8 h-8" />
        </div>
      </div>
    </div>
  )
}
