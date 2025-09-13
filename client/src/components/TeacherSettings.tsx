import { useState } from 'react'
import { useTeacherStudents, useDeleteStudent } from '../hooks/useStudents'

export const TeacherSettings = () => {
  const { data: studentsData, isLoading, isError } = useTeacherStudents()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const deleteStudent = useDeleteStudent({
    onSuccess: () => {
      setDeletingId(null)
    },
    onError: error => {
      setDeletingId(null)
      alert(`Virhe oppilaan poistamisessa: ${error.message}`)
    }
  })

  if (isLoading) {
    return <div>Ladataan oppilaita...</div>
  }

  if (isError) {
    return <div>Virhe oppilaiden lataamisessa</div>
  }

  const students = studentsData?.students || []

  return (
    <div>
      <h3>Oppilaiden hallinta</h3>
      {students.length === 0 ? (
        <p>Sinulla ei ole vielä oppilaita.</p>
      ) : (
        <div>
          <p>Oppilaat ({students.length}):</p>
          <ul>
            {students.map(student => (
              <li key={student.id}>
                <span>{student.name}</span>
                <button
                  onClick={() => {
                    if (deletingId) return
                    if (
                      confirm(
                        `Haluatko varmasti poistaa oppilaan ${student.name}?`
                      )
                    ) {
                      setDeletingId(student.id)
                      deleteStudent.mutate(student.id)
                    }
                  }}
                  disabled={deletingId === student.id}
                >
                  {deletingId === student.id ? 'Poistetaan...' : 'Poista'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

