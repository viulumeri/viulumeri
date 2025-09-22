import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTeacherStudentHomework } from '../hooks/useHomework'
import { HomeworkCarousel } from './HomeworkCarousel'
import ToggleSwitch, { ToggleSwitchValue } from './ToggleSwitch'
import { Header } from './Header'
import { ArrowLeft } from 'lucide-react'
import { getColorForStudent } from '../utils/studentcolors'

export const TeacherStudentHomeworkPage = () => {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [view, setView] = useState<ToggleSwitchValue>('homework')

  const studentName =
    (location.state as { studentName?: string } | undefined)?.studentName ??
    'Oppilas'

  const color = studentId ? getColorForStudent(studentId) : '#ccc'
  const { data, isPending, refetch } = useTeacherStudentHomework(studentId!)

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        left={
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6 text-gray-300 hover:text-white" />
          </button>
        }
        center={
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full"
              style={{ backgroundColor: color }}
            />
            <h2 className="">{studentName}</h2>
          </div>
        }
        right={<ToggleSwitch value={view} onChange={setView} />}
      />

      <main className="flex-1 overflow-y-auto pb-24">
        {view === 'homework' ? (
          <HomeworkCarousel
            mode="teacher"
            studentId={studentId}
            homework={data?.homework ?? []}
            isPending={isPending}
            refetch={refetch}
          />
        ) : (
          <div className="p-4">Biisilista placeholder</div>
        )}
      </main>
    </div>
  )
}
