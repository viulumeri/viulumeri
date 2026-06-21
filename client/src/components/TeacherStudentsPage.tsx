import { Users } from 'lucide-react'
import { TeacherStudentsList } from './TeacherStudentsList'
import { Header } from './Header'
import { PageContainer } from './PageContainer'

export const TeacherStudentsPage = () => {
  return (
    <div className="flex flex-col">
      <Header
        left={
          <h1 className="ml-7 flex items-center gap-3">
            <Users className="w-8 h-8" />
            Oppilaat
          </h1>
        }
        sticky={false}
      />
      <PageContainer>
        <TeacherStudentsList />
      </PageContainer>
    </div>
  )
}
