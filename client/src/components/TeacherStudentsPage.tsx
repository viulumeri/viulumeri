import { TeacherStudentsList } from './TeacherStudentsList'

export const TeacherStudentsPage = () => {
  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-10 px-4 py-3 bg-neutral-900 will-change-transform">
        <h1 className="ml-2">Oppilaat</h1>
      </header>
      <main className="flex-1 overflow-y-auto min-h-0">
        <TeacherStudentsList />
      </main>
    </div>
  )
}
