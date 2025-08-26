import { Route, Routes, Navigate } from 'react-router-dom'
import { useSession } from './auth-client'
import type { AppSessionUser } from '../../shared/types'

import { Login } from './components/Login'
import { Signup } from './components/SignUp'
import { MusicPlayer } from './components/MusicPlayer'
import { Songslist } from './components/Songslist'
import { InviteLink } from './components/InviteLink'
import { InviteAccept } from './components/InviteAccept'
import { TeacherStudentsPage } from './components/TeacherStudentsPage'
import { StudentHomeworkPage } from './components/StudentHomeworkPage'
import { TeacherStudentHomeworkPage } from './components/TeacherStudentHomeworkPage'
import { CreateHomeworkPage } from './components/CreateHomeworkPage'

import { AppLayout } from './components/AppLayout'
import PublicLayout from './components/PublicLayout'
import './index.css'

const App = () => {
  const { data: session } = useSession()
  const userType = (session?.user as AppSessionUser | undefined)?.userType

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicLayout>
            <Login />
          </PublicLayout>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicLayout>
            <Signup />
          </PublicLayout>
        }
      />
      <Route
        path="/invite/:token"
        element={
          <PublicLayout>
            <InviteAccept />
          </PublicLayout>
        }
      />

      {/* Protected routes */}
      {session && (
        <>
          {/* Shared */}
          <Route
            path="/songslist"
            element={
              <AppLayout>
                <Songslist />
              </AppLayout>
            }
          />
          <Route
            path="/player/:songId"
            element={
              <AppLayout>
                <MusicPlayer />
              </AppLayout>
            }
          />

          {/* Teacher-only */}
          {userType === 'teacher' && (
            <>
              <Route
                path="/invite"
                element={
                  <AppLayout>
                    <InviteLink />
                  </AppLayout>
                }
              />
              <Route
                path="/teacher/students"
                element={
                  <AppLayout>
                    <TeacherStudentsPage />
                  </AppLayout>
                }
              />
              <Route
                path="/teacher/students/:studentId/homework"
                element={
                  <AppLayout>
                    <TeacherStudentHomeworkPage />
                  </AppLayout>
                }
              />
              <Route
                path="/teacher/students/:studentId/homework/create"
                element={
                  <AppLayout>
                    <CreateHomeworkPage />
                  </AppLayout>
                }
              />
            </>
          )}

          {/* Student-only */}
          {userType === 'student' && (
            <Route
              path="/student/homework"
              element={
                <AppLayout>
                  <StudentHomeworkPage />
                </AppLayout>
              }
            />
          )}
        </>
      )}

      {/* Fallback */}
      <Route
        path="*"
        element={
          <Navigate
            to={
              userType === 'teacher'
                ? '/teacher/students'
                : userType === 'student'
                  ? '/student/homework'
                  : '/login'
            }
            replace
          />
        }
      />
    </Routes>
  )
}

export default App
