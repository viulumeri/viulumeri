import { useEffect } from 'react'
import { useTeacherStudents } from '../hooks/useTeacher'
import { Link } from 'react-router-dom'

export const TeacherStudents = () => {
  const { data, isPending, isError, error } = useTeacherStudents()

  useEffect(() => {
    if (isError) console.error('[TeacherStudents] error:', error)
  }, [data, isError, error])

  if (isPending) return <div>Ladataan oppilaita…</div>
  if (isError) return <div>Virhe ladattaessa oppilaita.</div>

  const list = data?.students ?? []
  if (list.length === 0) return <div>Ei vielä oppilaita.</div>

  return (
    <div>
      <h2>Oppilaat</h2>
      <ul>
        {list.map(s => (
          <li key={s.id} style={{ marginBottom: 8 }}>
            <Link to={`/teacher/students/${s.id}/homework`}>{s.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
