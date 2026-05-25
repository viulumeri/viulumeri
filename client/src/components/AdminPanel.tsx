import { useEffect, useState } from 'react'
import { Users, ScanSearch } from 'lucide-react'


interface SummaryResponse {
  teacherCount: number
  studentCount: number
  homeworkCount: number
}
interface Teacher {
  id: string
  name: string
  email: string
  studentCount: number
  students: { id: string; name: string; email: string }[]
}
interface Student {
  id: string
  name: string
  email: string
  playedSongs: number
  teacher: { id: string; name: string; email: string } | null
}
interface User {
  id: string
  name: string
  email: string
}

export const AdminPanel = () => {
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [students, setStudents] = useState<Student[]>([])

  const [searchUserInput, setSearchUserInput] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<Teacher | Student | null>(null)

  const handleSearchUserInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchUserInput(event.target.value)
    setSelectedUser(null)
  }

  useEffect(() => {

    const query = searchUserInput.trim().toLowerCase()

    if (!query) {

      setSearchResults([])

      return

    }



    setSearchResults(

      [...teachers, ...students].filter(user =>

        user.name.toLowerCase().includes(query) ||

        user.email.toLowerCase().includes(query)

      )

    )

  }, [searchUserInput, teachers, students])



  useEffect(() => {
    const loadData = async () => {
      try {
        // Load summary
        const summaryRes = await fetch('/api/admin/summary', { credentials: 'include' })
        if (!summaryRes.ok) {
          const body = await summaryRes.json().catch(() => ({}))
          throw new Error(body.error || 'Failed to load admin summary')
        }
        const summaryData = (await summaryRes.json()) as SummaryResponse
        setSummary(summaryData)

        // Load teachers
        const teachersRes = await fetch('/api/admin/teachers', { credentials: 'include' })
        if (!teachersRes.ok) {
          const body = await teachersRes.json().catch(() => ({}))
          throw new Error(body.error || 'Failed to load teachers')
        }
        const teachersData = (await teachersRes.json()) as { teachers: Teacher[] }
        setTeachers(teachersData.teachers)

        // Load students
        const studentsRes = await fetch('/api/admin/students', { credentials: 'include' })
        if (!studentsRes.ok) {
          const body = await studentsRes.json().catch(() => ({}))
          throw new Error(body.error || 'Failed to load students')
        }
        const studentsData = (await studentsRes.json()) as { students: Student[] }
        setStudents(studentsData.students)
        
        // Set combined users
        setUsers([...teachersData.teachers, ...studentsData.students])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
    }

    loadData()
  }, [])

  const buttonHandler = (event: React.FormEvent) => {
    event.preventDefault()
    if (searchResults.length > 0) {
      const user = searchResults[0]
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

      {summary ? (
        <div className="admin-summary">
          <div>Opettajia: {summary.teacherCount}</div>
          <div>Oppilaita: {summary.studentCount}</div>
          <div>Tehtäviä: {summary.homeworkCount}</div>
        </div>
      ) : (
        !error && <div>Ladataan yhteenvedon tietoja...</div>
      )}

{/*     <div className="space-y-6 p-6 pb-24">
      <h1 className="text-2xl font-bold">Admin Panel</h1>
        <button className="w-full" onClick={() => alert('Käyttäjien hallinta -toiminto ei ole vielä toteutettu')} >
          <div className="bg-neutral-800 rounded-lg p-6">
            <h3 className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6" />
              Käyttäjien hallinta
            </h3>
          </div>
        </button>
    </div> */}
      <form

        className="flex items-center max-w-sm mx-auto space-x-2"

        onSubmit={buttonHandler}

      >

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
