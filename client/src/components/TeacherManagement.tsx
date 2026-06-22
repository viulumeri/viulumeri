import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTeacher, useRemoveTeacher } from '../hooks/useTeacher'
import { ShieldCheck, UserX } from 'lucide-react'
import { useNotification } from '../hooks/useNotification'

export const TeacherManagement = () => {
  const [adminOpen, setAdminOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const queryClient = useQueryClient()
  const { data: teacherData } = useTeacher()
  const { showError, showSuccess } = useNotification()
  
  const removeTeacher = useRemoveTeacher({
    onSuccess: () => {
      setIsDeleting(false)
      queryClient.invalidateQueries({ queryKey: ['teacher'] })
      showSuccess('Opettaja poistettu onnistuneesti!')
    },
    onError: error => {
      setIsDeleting(false)
      showError(`Virhe opettajan poistossa: ${error.message}`)
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
    <div className="bg-neutral-900 rounded-lg py-3 mb-4">
      <button
        type="button"
        onClick={() => setAdminOpen(!adminOpen)}
        className="w-full flex items-center justify-between gap-3 mb-1
        bg-neutral-800 hover:bg-neutral-700 border border-neutral-700
        rounded-md px-4 py-3 text-left transition-colors min-h-[58px]"
      >
        <span className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6" />
          Opettajan hallinta
        </span>

        <span
          className={`transition-transform duration-200 ${
            adminOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {adminOpen && (
        <div className="mt-4 px-4 pb-2 space-y-4">
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
              <p className="text-gray-400 italic">Ei opettajaa</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}