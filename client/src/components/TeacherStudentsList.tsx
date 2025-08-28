import { useTeacherStudents } from '../hooks/useStudents'
import { StudentCard } from './StudentCard'

type Student = { id: string; name: string }

export const TeacherStudentsList = () => {
  const { data, isPending, isError } = useTeacherStudents()

  if (isPending) return <div>Ladataan oppilaita…</div>
  if (isError) return <div>Virhe ladattaessa oppilaita.</div>

  const list: Student[] = data?.students ?? []
  if (list.length === 0) return <div>Ei vielä oppilaita.</div>

  return (
    <div className="px-6">
      <div className="grid grid-cols-2 gap-5">
        {list.map(s => (
          <StudentCard key={s.id} id={s.id} name={s.name} />
        ))}
      </div>
    </div>
  )
}
