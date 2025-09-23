import { useSession } from '../auth-client'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useStudentHomework } from '../hooks/useHomework.ts'
import { useTeacher } from '../hooks/useTeacher.ts'
import { useOwnPlayedSongs } from '../hooks/usePlayedSongs.ts'

export const StudentStartPage = () => {
  const { data: session, isPending } = useSession()
  const { data: homeworkData } = useStudentHomework()
  const { data: teacherData, isPending: isTeacherPending } = useTeacher()
  const {
    data: playedData,
    isPending: isPlayedPending,
    isError: isPlayedError
  } = useOwnPlayedSongs()
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
  const playedCount = isPlayedPending
    ? 'Ladataan…'
    : isPlayedError
      ? '—'
      : (playedData?.playedSongs?.length ?? 0)

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
            className="button-basic"
          >
            Aloita
          </button>
        </div>
      </div>

      <div className="h-[30vh] bg-neutral-900 text-neutral-100 px-6 pt-12">
        <div className="flex gap-4">
          <div className="flex-1 h-28 flex flex-col justify-between items-center text-center">
            <p className="text-sm text-gray-400 px-1">Harjoituskerrat</p>
            <div className="text-xl font-bold pb-8">{practiceCount}</div>
          </div>

          <div className="flex-1 h-28 flex flex-col justify-between items-center text-center border-l border-gray-700 pl-3">
            <p className="text-sm text-gray-400 px-1">Opettaja</p>
            <div className="text-lg text-gray-100 pb-8">{teacherDisplay}</div>
          </div>

          <div className="flex-1 h-28 flex flex-col justify-between items-center text-center border-l border-gray-700 pl-3">
            <p className="text-sm text-gray-400 px-1">Soitetut kappaleet</p>
            <div className="text-xl font-bold pb-8">{playedCount}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
