import { useState } from 'react'
import { Users, Trash2, ScanSearch } from 'lucide-react'
import { useAdminSummary, useAdminTeachers, useAdminStudents } from '../hooks/useAdmin'
import type { Teacher, Student } from '../services/admin'



interface User {
  id: string
  name: string
  email: string
}

export const AdminPanel = () => {
  const { data: summaryData } = useAdminSummary()
  const { data: teachersData, isLoading: teachersLoading, error: teachersError } = useAdminTeachers()
  const { data: studentsData, isLoading: studentsLoading, error: studentsError } = useAdminStudents()

  const [searchUserInput, setSearchUserInput] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<Teacher | Student | null>(null)

  const teachers = teachersData?.teachers ?? []
  const students = studentsData?.students ?? []
  const error = teachersError || studentsError ? 'Failed to load admin data' : null
  const isLoading = teachersLoading || studentsLoading

  const handleSearchUserInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchUserInput(event.target.value)
    setSelectedUser(null)
    setSearchResults([...teachers, ...students].filter(user =>
      user.name.toLowerCase().includes(event.target.value.toLowerCase()) ||
      user.email.toLowerCase().includes(event.target.value.toLowerCase())
    ))
  }

  const buttonHandler = (event: React.FormEvent) => {
    event.preventDefault()
    if (searchResults.length > 0) {
      const user = searchResults[0]
      // add slice function to show only 3 first users
      const fullUserData = teachers.find(t => t.id === user.id) || students.find(s => s.id === user.id)
      if (fullUserData) {
        setSelectedUser(fullUserData)
      }
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


      <form className="flex items-center max-w-sm mx-auto space-x-2">   
        <label htmlFor="simple-search" className="sr-only">Search</label>
        <div className="relative w-full">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              <Users size={12} strokeWidth={1.5} />
            </div>
            <input type="text" id="simple-search" className="px-3 py-2.5 bg-neutral-secondary-medium border border-default-medium rounded-base ps-9 text-heading text-sm focus:ring-brand focus:border-brand block w-full placeholder:text-body" placeholder="Etsi käyttäjiä..." 
            onChange={handleSearchUserInputChange}
            />
            {searchUserInput !== "" && (searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-default-medium rounded-base shadow-lg z-10">
                {searchResults.map(user => (
                  <div key={user.id} className="p-2 bg-black hover:bg-black">
                    {user.name} ({user.email})
                  </div>
                ))}
              </div>
            ))}
        </div>
        <button type="submit" className="inline-flex items-center justify-center shrink-0 text-white bg-brand hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs rounded-base w-10 h-10 focus:outline-none"
          onClick={buttonHandler}
          >
        
            <ScanSearch size={22} strokeWidth={1.5} />
            <span className="sr-only">Icon description</span>
        </button>
      </form>

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
        </div>
      )}
    </div>
  )
}
