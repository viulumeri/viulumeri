import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTeacher, useRemoveTeacher } from '../hooks/useTeacher'
import { UserCheck, UserX } from 'lucide-react'

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
    <div className="bg-neutral-800 rounded-lg p-6">
      <h3 className="flex items-center gap-3 mb-4">
        <UserCheck className="w-6 h-6" />
        Opettajan hallinta
      </h3>
      <div className="space-y-4">
        <div className="bg-neutral-700 rounded-lg p-4">
          {teacherName ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Nykyinen opettaja:</p>
                <p className="text-gray-100 font-medium">{teacherName}</p>
              </div>
              <button
                onClick={handleRemoveTeacher}
                disabled={isDeleting}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserX className="w-4 h-4" />
                {isDeleting ? 'Poistetaan...' : 'Poista opettaja'}
              </button>
            </div>
          ) : (
            <p className="text-gray-400">Ei opettajaa</p>
          )}
        </div>
      </div>
    </div>
  )
}