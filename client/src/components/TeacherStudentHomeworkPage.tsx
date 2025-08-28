import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'

import { HomeworkCarousel } from './HomeworkCarousel'
import ToggleSwitch from './ToggleSwitch'
import { Header } from './Header'
import { ChevronLeft } from 'lucide-react'

export const TeacherStudentHomeworkPage = () => {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const studentName =
    (location.state as { studentName?: string } | undefined)?.studentName ??
    'Oppilas'

  const [view, setView] = useState<'homework' | 'songs'>('homework')

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        left={
          <button onClick={() => navigate(-1)}>
            <ChevronLeft className="w-6 h-6 text-gray-300 hover:text-white" />
          </button>
        }
        center={<h2 className="">{studentName}</h2>}
        right={<ToggleSwitch view={view} setView={setView} />}
      />

      <main className="flex-1 overflow-y-auto pb-24">
        {view === 'homework' ? (
          <HomeworkCarousel studentId={studentId!} mode="teacher" />
        ) : (
          <div className="p-4">Biisilista placeholder</div>
        )}
      </main>
    </div>
  )
}
