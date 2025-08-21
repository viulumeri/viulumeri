import { useTeacherStudents } from '../hooks/useStudents'
import { Link } from 'react-router-dom'

export const TeacherStudentsList = () => {
  const { data, isPending, isError } = useTeacherStudents()

  if (isPending) return <div>Ladataan oppilaita…</div>
  if (isError) return <div>Virhe ladattaessa oppilaita.</div>

  const list = data?.students ?? []
  if (list.length === 0) return <div>Ei vielä oppilaita.</div>

  return (
    <ul>
      {list.map(s => (
        <li key={s.id} style={{ marginBottom: 8 }}>
          <Link to={`/teacher/students/${s.id}/homework`}>{s.name}</Link>
        </li>
      ))}
    </ul>
  )
}
