import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTeacher, useRemoveTeacher } from '../hooks/useTeacher'

export const TeacherManagement = () => {
  const [isDeleting, setIsDeleting] = useState(false)
  const queryClient = useQueryClient()
  const { data: teacherData } = useTeacher()
  
  const removeTeacher = useRemoveTeacher({
    onSuccess: () => {
      setIsDeleting(false)
      queryClient.invalidateQueries({ queryKey: ['teacher'] })
      alert('Opettaja poistettu onnistuneesti!')
    },
    onError: error => {
      setIsDeleting(false)
      alert(`Virhe opettajan poistossa: ${error.message}`)
    }
  })

  const handleRemoveTeacher = () => {
    if (confirm('Haluatko varmasti poistaa opettajan?')) {
      setIsDeleting(true)
      removeTeacher.mutate()
    }
  }

  const teacherName = teacherData?.teacher?.name

  return (
    <div>
      <h3>Opettajan hallinta</h3>
      <p>{teacherName ? `Opettaja: ${teacherName}` : 'Ei opettajaa'}</p>
      {teacherName && (
        <button onClick={handleRemoveTeacher} disabled={isDeleting}>
          {isDeleting ? 'Poistetaan opettajaa...' : 'Poista opettaja'}
        </button>
      )}
    </div>
  )
}