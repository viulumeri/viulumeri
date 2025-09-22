import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import ToggleSwitch from './ToggleSwitch'
import { Header } from './Header'
import { ArrowLeft } from 'lucide-react'
import { getColorForStudent } from '../utils/studentcolors'

export function TeacherStudentLayout() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const studentName =
    (location.state as { studentName?: string } | undefined)?.studentName ??
    'Oppilas'

  const color = studentId ? getColorForStudent(studentId) : '#ccc'

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
            <h2>{studentName}</h2>
          </div>
        }
        right={<ToggleSwitch value="homework" onChange={() => {}} />}
      />

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
