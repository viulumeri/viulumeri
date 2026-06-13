import { TeacherStudentsList } from './TeacherStudentsList'
import { Header } from './Header'
import { PageContainer } from './PageContainer'

export const TeacherStudentsPage = () => {
  return (
    <div className="flex flex-col">
      <Header left={<h1 className="ml-2">Oppilaat</h1>} />
      <PageContainer>
        <TeacherStudentsList />
      </PageContainer>
    </div>
  )
}
