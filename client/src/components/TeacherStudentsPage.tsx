import { Users } from 'lucide-react'
import { TeacherStudentsList } from './TeacherStudentsList'
import { PageContainer } from './PageContainer'

export const TeacherStudentsPage = () => {
  return (
    <div className="flex flex-col">
      <PageContainer>
        <div className="px-6">
          <h1 className="flex items-center gap-3">
            <Users className="w-8 h-8" />
            Oppilaat
          </h1>
        </div>
        <TeacherStudentsList />
      </PageContainer>
    </div>
  )
}
