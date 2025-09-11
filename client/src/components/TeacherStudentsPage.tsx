import { TeacherStudentsList } from './TeacherStudentsList'
import { Header } from './Header'

export const TeacherStudentsPage = () => {
  return (
    <div className="flex flex-col h-screen">
      <Header left={<h1 className="ml-2">Oppilaat</h1>} />
      <main className="flex-1 overflow-y-auto min-h-0">
        <TeacherStudentsList />
      </main>
    </div>
  )
}
