import { useMemo, useState } from 'react'
import { Search, CircleEllipsis } from 'lucide-react'
import { useAdminTeachers, useAdminStudents, useDeleteAdminTeacher, useDeleteAdminStudent, useImpersonateAdminUser } from '../hooks/useAdmin'
import { DropdownSearchbar } from './DropdownSearchbar'
import { useNotification } from '../hooks/useNotification'
import type { Teacher, Student } from '../services/admin'


interface SearchResultUser {
  id: string
  name: string
  email: string
  role: 'teacher' | 'student'
}

export const AdminPanel = () => {
  const { data: teachersData, error: teachersError } = useAdminTeachers()
  const { data: studentsData, error: studentsError } = useAdminStudents()

  const [searchUserInput, setSearchUserInput] = useState('')
  const [selectedUser, setSelectedUser] = useState<Teacher | Student | null>(null)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null)

  const { showSuccess, showError } = useNotification()

  const deleteTeacher = useDeleteAdminTeacher({
    onSuccess: () => {
      setSelectedUser(null)
      setDeletingId(null)
      showSuccess('Käyttäjä poistettu onnistuneesti')
    },
    onError: (error) => {
      setDeletingId(null)
      showError(`Virhe käyttäjän poistamisessa: ${error.message}`)
    }
  })

  const deleteStudent = useDeleteAdminStudent({
    onSuccess: () => {
      setSelectedUser(null)
      setDeletingId(null)
      showSuccess('Käyttäjä poistettu onnistuneesti')
    },
    onError: (error) => {
      setDeletingId(null)
      showError(`Virhe käyttäjän poistamisessa: ${error.message}`)
    }
  })

  const impersonateUser = useImpersonateAdminUser({
    onSuccess: () => {
      showSuccess('Kirjaudutaan käyttäjänä sisään...')
      window.location.href = '/'
    },
    onError: (error) => {
      setImpersonatingId(null)
      showError(`Virhe käyttäjän impersonoinnissa: ${error.message}`)
    }
  })

  const teachers = useMemo(() => teachersData?.teachers ?? [], [teachersData])
  const students = useMemo(() => studentsData?.students ?? [], [studentsData])
  const error = teachersError || studentsError ? 'Failed to load admin data' : null

  const allUsers = useMemo<SearchResultUser[]>(() => [
    ...teachers.map((teacher) => ({
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      role: 'teacher' as const
    })),
    ...students.map((student) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      role: 'student' as const
    }))
  ], [teachers, students])

  const searchResults = useMemo(() => {
    const normalizedValue = searchUserInput.trim().toLowerCase()

    if (!normalizedValue) {
      return allUsers
    }

    return allUsers.filter((user) =>
      user.name.toLowerCase().includes(normalizedValue) ||
      user.email.toLowerCase().includes(normalizedValue)
    )
  }, [allUsers, searchUserInput])

  const handleSearchUserInputChange = (value: string) => {
    setSearchUserInput(value)
    setSelectedUser(null)
    setActionsOpen(false)
  }

  const handleResultSelect = (user: SearchResultUser) => {
    const fullUserData = user.role === 'teacher'
      ? teachers.find((teacher) => teacher.id === user.id)
      : students.find((student) => student.id === user.id)
    if (fullUserData) {
      setSelectedUser(fullUserData)
      setActionsOpen(false)
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (searchResults.length > 0) {
      handleResultSelect(searchResults[0])
    }
  }

  const selectedResultKey = selectedUser
    ? `${'studentCount' in selectedUser ? 'teacher' : 'student'}-${selectedUser.id}`
    : null

  return (
    <div className="space-y-4 p-5 pb-24">
      <div className="admin-panel">
        <h1 className="flex items-center gap-3">
          <Search className="w-8 h-8" />
          Käyttäjähaku
        </h1>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-600 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="mt-5">
          <DropdownSearchbar
            onSearchInputChange={handleSearchUserInputChange}
            onResultSelect={handleResultSelect}
            onSubmit={handleSubmit}
            renderExpandedResult={() => selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm text-neutral-300">
                    <div className="mt-3 space-y-2 text-sm text-neutral-200">
                      {'studentCount' in selectedUser ? (
                        <>
                          <div><span className="font-semibold">Oppilaita:</span> {selectedUser.studentCount}</div>
                        </>
                      ) : (
                        <>
                          <div><span className="font-semibold">Opettajia:</span> {selectedUser.teacher ? 1 : 0}</div>
                          {selectedUser.teacher ? (
                            <div><span className="font-semibold">Opettaja:</span> {selectedUser.teacher.name} ({selectedUser.teacher.email})</div>
                          ) : (
                            <div>Opettajaa ei ole asetettu</div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="relative text-right">
                    <button
                      type="button"
                      aria-label="Avaa käyttäjätoiminnot"
                      onClick={() => setActionsOpen(prev => !prev)}
                      className="inline-flex items-center justify-center p-2 rounded-full bg-neutral-700 transition-colors hover:bg-neutral-600 active:bg-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
                    >
                      <CircleEllipsis />
                    </button>
                    {actionsOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-20">
                        <button
                          type="button"
                          disabled={Boolean(impersonatingId)}
                          onClick={() => {
                            if (impersonatingId) return
                            setActionsOpen(false)
                            setImpersonatingId(selectedUser.userId)
                            impersonateUser.mutate({ userId: selectedUser.userId })
                          }}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-neutral-800 active:bg-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {impersonatingId === selectedUser.userId ? 'Impersonoidaan...' : 'Impersonoi'}
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(deletingId)}
                          onClick={() => {
                            if (deletingId) return
                            setActionsOpen(false)
                            if (confirm(`Haluatko varmasti poistaa käyttäjän ${selectedUser.name}? Toimintoa ei voi perua.`)) {
                              setDeletingId(selectedUser.id)
                              if ('studentCount' in selectedUser) {
                                deleteTeacher.mutate(selectedUser.id)
                              } else {
                                deleteStudent.mutate(selectedUser.id)
                              }
                            }
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-rose-400 hover:bg-neutral-800 active:bg-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === selectedUser.id ? 'Poistetaan...' : 'Poista käyttäjä'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            searchInput={searchUserInput}
            searchResults={searchResults}
            selectedResultKey={selectedResultKey}
          />
        </div>
      </div>
    </div>
  )
}
