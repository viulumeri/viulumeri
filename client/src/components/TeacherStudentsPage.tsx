import { TeacherStudentsList } from './TeacherStudentsList'
import { Navbar } from './Navbar.tsx'

export const TeacherStudentsPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky p-4 align-text-top">
        <h1 className="ml-2"> Oppilaat</h1>
      </header>
      <main className="flex-1 overflow-y-auto">
        <TeacherStudentsList />
      </main>
      <Navbar />
    </div>
  )
}
