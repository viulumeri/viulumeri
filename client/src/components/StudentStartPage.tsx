import { useSession } from '../auth-client'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useStudentHomework } from '../hooks/useHomework.ts'
import { useTeacher } from '../hooks/useTeacher.ts'

export const StudentStartPage = () => {
  const { data: session, isPending } = useSession()
  const { data: homeworkData } = useStudentHomework()
  const { data: teacherData, isPending: isTeacherPending } = useTeacher()
  const navigate = useNavigate()

  useEffect(() => {
    localStorage.setItem('studentLastHomeworkRoute', '/student/homework')
  }, [])

  if (isPending) return <div>Ladataan...</div>
  if (!session?.user?.name) return <div>Kirjaudu sisään</div>

  const latestHomework = homeworkData?.homework?.[0]
  const practiceCount = latestHomework?.practiceCount ?? 0
  const teacherName = teacherData?.teacher?.name ?? '–'
  const teacherDisplay = isTeacherPending ? 'Ladataan…' : teacherName

  return (
    <div className="min-h-screen flex flex-col">
      <div
        className="relative flex flex-col justify-end h-[70vh] px-6"
        style={{
          backgroundImage:
            'url("https://images.metmuseum.org/CRDImages/ad/original/ap06.1281.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute bottom-0 left-0 right-0 h-25 bg-gradient-to-b from-transparent to-neutral-900 z-10" />

        <header className="absolute top-0 px-10 pt-6">
          <h1 className="bg-transparent font-semibold">
            Hei {session.user.name}
          </h1>
        </header>

        <div className="flex justify-center pb-3 z-20">
          <button
            onClick={() => {
              localStorage.setItem(
                'studentLastHomeworkRoute',
                '/student/homework/list'
              )
              navigate('/student/homework/list')
            }}
            className="bg-neutral-100  text-black rounded-full px-6 py-2 text-xl "
          >
            Aloita
          </button>
        </div>
      </div>

      <div className="h-[30vh] bg-neutral-900 text-neutral-100 px-6 pt-12 flex items-start justify-between">
        <div className="flex-1 text-center pt-3">
          <p className="text-sm  text-gray-400  mb-2">Harjoituskerrat</p>
          <div className="text-xl text-neutral-100 font-bold pt-4">
            {practiceCount}
          </div>
        </div>
        <div className="flex-1 text-center pt-3 border-l border-gray-700 h-28 flex flex-col justify-start pl-1">
          <p className="text-sm text-gray-400 mb-2 ">Opettaja</p>
          <div className="text-l text-gray-100 pt-4 ">{teacherDisplay}</div>
        </div>
        <div className="flex-1 text-center pt-3 border-l border-gray-700 h-28 flex flex-col justify-start pl-1 ">
          <p className="text-sm  text-gray-400 mb-2 ml-2">Soitetut kappaleet</p>
        </div>
      </div>
    </div>
  )
}
