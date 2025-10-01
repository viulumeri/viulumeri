import { useState } from 'react'
import { useTeacherStudents, useDeleteStudent } from '../hooks/useStudents'
import { Users, Trash2 } from 'lucide-react'

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
    return (
      <div className="bg-neutral-800 rounded-lg p-6">
        <div className="animate-pulse text-gray-400">Ladataan oppilaita...</div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-neutral-800 rounded-lg p-6">
        <div className="text-red-400">Virhe oppilaiden lataamisessa</div>
      </div>
    )
  }

  const students = studentsData?.students || []

  return (
    <div className="bg-neutral-800 rounded-lg p-6">
      <h3 className="flex items-center gap-3 mb-4">
        <Users className="w-6 h-6" />
        Oppilaiden hallinta
      </h3>
      {students.length === 0 ? (
        <p className="text-gray-400">Sinulla ei ole vielä oppilaita.</p>
      ) : (
        <div>
          <p className="text-gray-300 mb-4">Oppilaat ({students.length}):</p>
          <div className="space-y-3">
            {students.map(student => (
              <div key={student.id} className="flex items-center justify-between bg-neutral-700 rounded-lg p-4">
                <span className="text-gray-100 font-medium">{student.name}</span>
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
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-md px-3 py-1 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  {deletingId === student.id ? 'Poistetaan...' : 'Poista'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

