import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import {
  useAdminTeachers,
  useAdminStudents,
  useDeleteAdminTeacher,
  useDeleteAdminStudent,
  useImpersonateAdminUser,
  useUpdateAdminUser
} from '../hooks/useAdmin'
import { DropdownSearchbar } from './DropdownSearchbar'
import { useNotification } from '../hooks/useNotification'
import type { Teacher, Student } from '../services/admin'
import type { SearchResultUser } from '../types/admin'

type AdminUserSortMode = 'name' | 'email' | 'teachers' | 'students'

export const AdminPanel = () => {
  const { data: teachersData, error: teachersError } = useAdminTeachers()
  const { data: studentsData, error: studentsError } = useAdminStudents()

  const [searchUserInput, setSearchUserInput] = useState('')
  const [sortMode, setSortMode] = useState<AdminUserSortMode>('name')
  const [selectedUser, setSelectedUser] = useState<Teacher | Student | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')

  const { showSuccess, showError } = useNotification()

  const deleteTeacher = useDeleteAdminTeacher({
    onSuccess: () => {
      setSelectedUser(null)
      setDeletingId(null)
      showSuccess('Käyttäjä poistettu onnistuneesti')
    },
    onError: error => {
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
    onError: error => {
      setDeletingId(null)
      showError(`Virhe käyttäjän poistamisessa: ${error.message}`)
    }
  })

  const impersonateUser = useImpersonateAdminUser({
    onSuccess: () => {
      showSuccess('Kirjaudutaan käyttäjänä sisään...')
      window.location.href = '/'
    },
    onError: error => {
      setImpersonatingId(null)
      showError(`Virhe käyttäjän impersonoinnissa: ${error.message}`)
    }
  })

  const updateUser = useUpdateAdminUser({
    onSuccess: ({ user }) => {
      setSelectedUser(current =>
        current?.id === user.id ? { ...current, ...user } : current
      )
      setEditing(false)
      showSuccess('Käyttäjän tiedot päivitetty')
    },
    onError: error => {
      showError(`Virhe käyttäjän muokkaamisessa: ${error.message}`)
    }
  })

  const teachers = useMemo(() => teachersData?.teachers ?? [], [teachersData])
  const students = useMemo(() => studentsData?.students ?? [], [studentsData])
  const error = teachersError || studentsError ? 'Failed to load admin data' : null

  const allUsers = useMemo<SearchResultUser[]>(
    () => [
      ...teachers.map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        isAdmin: teacher.isAdmin,
        isCurrentUser: teacher.isCurrentUser,
        role: 'teacher' as const
      })),
      ...students.map(student => ({
        id: student.id,
        name: student.name,
        email: student.email,
        isAdmin: student.isAdmin,
        isCurrentUser: student.isCurrentUser,
        role: 'student' as const
      }))
    ],
    [teachers, students]
  )

  const searchResults = useMemo(() => {
    const normalizedValue = searchUserInput.trim().toLowerCase()

    const filteredUsers = normalizedValue
      ? allUsers.filter(
          user =>
            user.name.toLowerCase().includes(normalizedValue) ||
            user.email.toLowerCase().includes(normalizedValue)
        )
      : allUsers

    return [...filteredUsers].sort((left, right) => {
      if (sortMode === 'teachers' && left.role !== right.role) {
        return left.role === 'teacher' ? -1 : 1
      }
      if (sortMode === 'students' && left.role !== right.role) {
        return left.role === 'student' ? -1 : 1
      }
      if (sortMode === 'email') {
        return left.email.localeCompare(right.email, 'fi')
      }

      return left.name.localeCompare(right.name, 'fi')
    })
  }, [allUsers, searchUserInput, sortMode])

  const handleSearchUserInputChange = (value: string) => {
    setSearchUserInput(value)
    setSelectedUser(null)
    setEditing(false)
  }

  const handleResultSelect = (user: SearchResultUser) => {
    if (selectedResultKey === `${user.role}-${user.id}`) {
      setSelectedUser(null)
      setEditing(false)
      return
    }

    const fullUserData =
      user.role === 'teacher'
        ? teachers.find(teacher => teacher.id === user.id)
        : students.find(student => student.id === user.id)

    if (fullUserData) {
      setSelectedUser(fullUserData)
      setEditing(false)
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
    <div className="admin-page">
      <div className="admin-panel">
        <h1 className="admin-page-title">
          <Search className="admin-page-title-icon" />
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
            renderExpandedResult={() =>
              selectedUser && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-neutral-300">
                      <div className="mt-3 space-y-2 text-sm text-neutral-200">
                        {'studentCount' in selectedUser ? (
                          <div>
                            <span className="font-semibold">Oppilaita:</span>{' '}
                            {selectedUser.studentCount}
                          </div>
                        ) : (
                          <>
                            <div>
                              <span className="font-semibold">Opettajia:</span>{' '}
                              {selectedUser.teacher ? 1 : 0}
                            </div>
                            {selectedUser.teacher ? (
                              <div>
                                <span className="font-semibold">Opettaja:</span>{' '}
                                {selectedUser.teacher.name} ({selectedUser.teacher.email})
                              </div>
                            ) : (
                              <div>Opettajaa ei ole asetettu</div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 self-start sm:self-center sm:justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setEditName(selectedUser.name)
                          setEditEmail(selectedUser.email)
                          setEditing(true)
                        }}
                        className="button-basic !px-3 !py-3 !text-sm"
                      >
                        Muokkaa
                      </button>

                      {!selectedUser.isAdmin && (
                        <button
                          type="button"
                          disabled={Boolean(impersonatingId)}
                          onClick={() => {
                            if (impersonatingId) return
                            setImpersonatingId(selectedUser.userId)
                            impersonateUser.mutate({ userId: selectedUser.userId })
                          }}
                          className="button-basic !px-3 !py-3 !text-sm disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {impersonatingId === selectedUser.userId
                            ? 'Impersonoidaan...'
                            : 'Impersonoi'}
                        </button>
                      )}

                      {!selectedUser.isAdmin && !selectedUser.isCurrentUser && (
                        <button
                          type="button"
                          disabled={Boolean(deletingId)}
                          onClick={() => {
                            if (deletingId) return
                            if (
                              confirm(
                                `Haluatko varmasti poistaa käyttäjän ${selectedUser.name}? Toimintoa ei voi perua.`
                              )
                            ) {
                              setDeletingId(selectedUser.id)
                              if ('studentCount' in selectedUser) {
                                deleteTeacher.mutate(selectedUser.id)
                              } else {
                                deleteStudent.mutate(selectedUser.id)
                              }
                            }
                          }}
                          className="button-basic !px-3 !py-3 !text-sm bg-red-600 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === selectedUser.id ? 'Poistetaan...' : 'Poista käyttäjä'}
                        </button>
                      )}
                    </div>
                  </div>

                  {editing && (
                    <form
                      className="space-y-3 border-t border-neutral-700 pt-4"
                      onSubmit={event => {
                        event.preventDefault()
                        if (updateUser.isPending) return
                        updateUser.mutate({
                          id: selectedUser.id,
                          role: 'studentCount' in selectedUser ? 'teacher' : 'student',
                          name: editName.trim(),
                          email: editEmail.trim()
                        })
                      }}
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-1 text-left text-sm text-neutral-300">
                          <span className="font-semibold">Nimi</span>
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={event => setEditName(event.target.value)}
                            className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-neutral-100 focus:border-neutral-400 focus:outline-none"
                          />
                        </label>
                        <label className="space-y-1 text-left text-sm text-neutral-300">
                          <span className="font-semibold">Sähköposti</span>
                          <input
                            type="email"
                            required
                            value={editEmail}
                            onChange={event => setEditEmail(event.target.value)}
                            className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-neutral-100 focus:border-neutral-400 focus:outline-none"
                          />
                        </label>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          disabled={updateUser.isPending}
                          onClick={() => setEditing(false)}
                          className="rounded-lg border border-neutral-600 px-4 py-2 text-sm hover:bg-neutral-800 disabled:opacity-50"
                        >
                          Peruuta
                        </button>
                        <button
                          type="submit"
                          disabled={updateUser.isPending}
                          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updateUser.isPending ? 'Tallennetaan...' : 'Tallenna'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )
            }
            searchInput={searchUserInput}
            searchResults={searchResults}
            selectedResultKey={selectedResultKey}
            toolbarEnd={
              <label className="flex items-center gap-2 text-sm text-neutral-300">
                <span>Järjestys</span>
                <select
                  value={sortMode}
                  onChange={event => setSortMode(event.target.value as AdminUserSortMode)}
                  className="rounded-md border border-neutral-600 bg-neutral-700 px-3 py-2 text-sm text-gray-100 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Nimi</option>
                  <option value="email">Sähköposti</option>
                  <option value="teachers">Opettajat</option>
                  <option value="students">Oppilaat</option>
                </select>
              </label>
            }
          />
        </div>
      </div>
    </div>
  )
}
