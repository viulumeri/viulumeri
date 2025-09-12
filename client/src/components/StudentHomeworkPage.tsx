import { useSession } from '../auth-client'
import { HomeworkCarousel } from './HomeworkCarousel'
import { useStudentHomework } from '../hooks/useHomework'
import { Header } from './Header'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const StudentHomeworkPage = () => {
  const { data: session, isPending: Pending } = useSession()
  const { data, isPending, refetch } = useStudentHomework()
  const navigate = useNavigate()

  if (Pending || isPending) return <div>Ladataan…</div>
  if (!session?.user?.id) return <div>Kirjaudu sisään</div>

  return (
    <div>
      <Header
        left={
          <button onClick={() => navigate(-1)}>
            <ChevronLeft className="w-6 h-6 text-gray-300 hover:text-white" />
          </button>
        }
        center={<h1 className="">Otsikko tähän?</h1>}
      />
      <HomeworkCarousel
        mode="student"
        studentId={session.user.id}
        homework={data?.homework ?? []}
        isPending={false}
        refetch={refetch}
      />
    </div>
  )
}
