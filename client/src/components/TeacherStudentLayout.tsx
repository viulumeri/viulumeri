import {
  Outlet,
  useLocation,
  useMatch,
  useNavigate,
  useParams
} from 'react-router-dom'
import ToggleSwitch from './ToggleSwitch'
import { Header } from './Header'
import { ArrowLeft } from 'lucide-react'
import { getColorForStudent } from '../utils/studentcolors'

export function TeacherStudentLayout() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const studentName =
    (location.state as { studentName?: string } | undefined)?.studentName ?? ''

  const spaceIndex = studentName.indexOf(' ')
  const firstName =
    spaceIndex !== -1 ? studentName.substring(0, spaceIndex) : studentName

  const color = studentId ? getColorForStudent(studentId) : '#ccc'
  const onSongs = !!useMatch('/teacher/students/:studentId/songs')
  const toggleValue: 'homework' | 'songs' = onSongs ? 'songs' : 'homework'

  return (
    <div className="flex flex-col">
      <Header
        left={
          <button
            onClick={() => navigate('/teacher/students', { replace: true })}
          >
            <ArrowLeft className="w-6 h-6 text-gray-300 hover:text-white" />
          </button>
        }
        center={
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full"
              style={{ backgroundColor: color }}
            />
            <h2>{firstName}</h2>
          </div>
        }
        right={
          <ToggleSwitch
            value={toggleValue}
            onChange={next => {
              if (!studentId) return
              navigate(
                next === 'songs'
                  ? `/teacher/students/${studentId}/songs`
                  : `/teacher/students/${studentId}/homework`,
                { state: { studentName }, replace: true }
              )
            }}
          />
        }
      />

      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
    </div>
  )
}
