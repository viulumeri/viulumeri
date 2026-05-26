import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useAdminSummary, useAdminTeachers, useAdminStudents, useDeleteAdminTeacher, useDeleteAdminStudent } from '../hooks/useAdmin'
import { DropdownSearchbar } from './DropdownSearchbar'
import { useNotification } from '../hooks/useNotification'
import type { Teacher, Student } from '../services/admin'



interface User {
  id: string
  name: string
  email: string
}

export const AdminPanel = () => {
  const { data: summaryData } = useAdminSummary()
  const { data: teachersData, error: teachersError } = useAdminTeachers()
  const { data: studentsData, error: studentsError } = useAdminStudents()

  const [searchUserInput, setSearchUserInput] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<Teacher | Student | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

  const teachers = teachersData?.teachers ?? []
  const students = studentsData?.students ?? []
  const error = teachersError || studentsError ? 'Failed to load admin data' : null

  const handleSearchUserInputChange = (value: string) => {
    setSearchUserInput(value)
    setSelectedUser(null)
    setSearchResults([...teachers, ...students].filter(user =>
      user.name.toLowerCase().includes(value.toLowerCase()) ||
      user.email.toLowerCase().includes(value.toLowerCase())
    ))
  }

  const handleResultSelect = (user: User) => {
    const fullUserData = teachers.find(t => t.id === user.id) || students.find(s => s.id === user.id)
    if (fullUserData) {
      setSelectedUser(fullUserData)
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (searchResults.length > 0) {
      handleResultSelect(searchResults[0])
    }
  }


  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      <p>Tämä on superkäyttäjän hallintapaneelin kanta. Tässä voidaan myöhemmin näyttää järjestelmän tilanne ja hallintatoiminnot.</p>

      {error && <div className="error">{error}</div>}

      {summaryData ? (
        <div className="admin-summary">
          <div>Opettajia: {summaryData.teacherCount}</div>
          <div>Oppilaita: {summaryData.studentCount}</div>
          <div>Tehtäviä: {summaryData.homeworkCount}</div>
        </div>
      ) : (
        !error && <div>Ladataan yhteenvedon tietoja...</div>
      )}


      <DropdownSearchbar
        onSearchInputChange={handleSearchUserInputChange}
        onResultSelect={handleResultSelect}
        onSubmit={handleSubmit}
        searchInput={searchUserInput}
        searchResults={searchResults}
      />

      {selectedUser && (
        <div className="mt-6 p-4 bg-neutral-800 rounded-lg">
          <h2 className="text-lg font-bold mb-3">{selectedUser.name}</h2>
          <div className="space-y-2">
            <p><strong>Email:</strong> {selectedUser.email}</p>
            {'studentCount' in selectedUser && (
              <>
                <p><strong>Oppilaita:</strong> {selectedUser.studentCount}</p>
                <p><strong>Oppilaiden lukumäärä:</strong> {selectedUser.students?.length || 0}</p>
                {selectedUser.students && selectedUser.students.length > 0 && (
                  <div className="mt-3">
                    <p><strong>Oppilaat:</strong></p>
                    <ul className="ml-4 space-y-1">
                      {selectedUser.students.map(student => (
                        <li key={student.id}>{student.name} ({student.email})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
          <button
            onClick={() => {
              if (deletingId) return
              if (confirm(`Haluatko varmasti poistaa käyttäjän ${selectedUser.name}? Toimintoa ei voi perua.`)) {
                setDeletingId(selectedUser.id)
                if ('studentCount' in selectedUser) {
                  deleteTeacher.mutate(selectedUser.id)
                } else {
                  deleteStudent.mutate(selectedUser.id)
                }
              }
            }}
            disabled={deletingId === selectedUser.id}
            className="flex items-center gap-2 mt-4 bg-red-600 hover:bg-red-700 text-white rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            {deletingId === selectedUser.id ? 'Poistetaan...' : 'Poista käyttäjä'}
          </button>
        </div>
      )}
    </div>
  )
}
