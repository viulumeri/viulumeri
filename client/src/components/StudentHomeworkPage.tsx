import { useSession } from '../auth-client'
import { HomeworkCarousel } from './HomeworkCarousel'
import { useStudentHomework } from '../hooks/useHomework'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export const StudentHomeworkPage = () => {
  const { data: session, isPending: Pending } = useSession()
  const { data, isPending, refetch } = useStudentHomework()
  const navigate = useNavigate()

  useEffect(() => {
    localStorage.setItem('studentLastHomeworkRoute', '/student/homework/list')
  }, [])

  if (Pending || isPending) return <div>Ladataan…</div>
  if (!session?.user?.id) return <div>Kirjaudu sisään</div>

  return (
    <div>
      <HomeworkCarousel
        mode="student"
        studentId={session.user.id}
        homework={data?.homework ?? []}
        isPending={false}
        refetch={refetch}
        header={
          <div className="flex items-center">
            <div className="w-10 flex justify-start">
              <button onClick={() => navigate('/student/homework')}>
                <ArrowLeft className="w-6 h-6 text-gray-300 hover:text-white" />
              </button>
            </div>
            <div className="pl-2">
              <h1>Tehtäväsi</h1>
            </div>
          </div>
        }
      />
    </div>
  )
}
