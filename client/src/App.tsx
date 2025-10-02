import { Login } from './components/Login.tsx'
import { Signup } from './components/SignUp.tsx'
import { SignupSuccess } from './components/SignupSuccess'
import { ForgotPassword } from './components/ForgotPassword'
import { ResetPassword } from './components/ResetPassword'
import { EmailVerified } from './components/EmailVerified'
import { MusicPlayer } from './components/MusicPlayer'
import { InviteLink } from './components/InviteLink'
import { InviteAccept } from './components/InviteAccept'
import { TeacherStudentsPage } from './components/TeacherStudentsPage'
import { StudentHomeworkPage } from './components/StudentHomeworkPage'
import { TeacherStudentHomeworkPage } from './components/TeacherStudentHomeworkPage.tsx'
import { HomeworkCreatePage } from './components/HomeworkCreatePage'
import { StudentStartPage } from './components/StudentStartPage'
import { TeacherStudentSongsPage } from './components/TeacherStudentSongsPage'
import { TeacherStudentLayout } from './components/TeacherStudentLayout'
import { SongslistPage } from './components/SongslistPage'
import { HomeworkEditPage } from './components/HomeworkEditPage'
import { SelectSongsPage } from './components/SelectSongsPage'

import { AppLayout } from './components/AppLayout'
import PublicLayout from './components/PublicLayout'
import { SettingsPage } from './components/SettingsPage'
import { Route, Routes, Navigate } from 'react-router-dom'
import { useSession } from './auth-client'
import type { AppSessionUser } from '../../shared/types'
import './index.css'

const App = () => {
  const { data: session, isPending } = useSession()
  const userType = (session?.user as AppSessionUser | undefined)?.userType

  if (isPending) {
    return <div>Ladataan...</div>
  }

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
        path="/signup-success"
        element={
          <PublicLayout>
            <SignupSuccess />
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
      <Route
        path="/email-verified"
        element={
          <PublicLayout>
            <EmailVerified />
          </PublicLayout>
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected routes */}
      {session && (
        <>
          {/* Shared */}
          <Route
            path="/player/:songId"
            element={
              <AppLayout showNavbar={false}>
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
                path="/teacher/students/:studentId"
                element={
                  <AppLayout>
                    <TeacherStudentLayout />
                  </AppLayout>
                }
              >
                <Route index element={<Navigate to="homework" replace />} />
                <Route
                  path="homework"
                  element={<TeacherStudentHomeworkPage />}
                />
                <Route path="songs" element={<TeacherStudentSongsPage />} />
                <Route
                  path="homework/:homeworkId/edit"
                  element={<HomeworkEditPage />}
                />
                <Route
                  path="homework/create"
                  element={<HomeworkCreatePage />}
                />
              </Route>

              <Route
                path="/teacher/students/:studentId/homework/create/select-songs"
                element={
                  <AppLayout showNavbar={false}>
                    <SelectSongsPage />
                  </AppLayout>
                }
              />

              <Route
                path="/teacher/students/:studentId/homework/:homeworkId/select-songs"
                element={
                  <AppLayout showNavbar={false}>
                    <SelectSongsPage />
                  </AppLayout>
                }
              />
            </>
          )}

          {/* Student-only */}
          {userType === 'student' && (
            <>
              <Route
                path="/student/homework"
                element={
                  <AppLayout>
                    <StudentStartPage />
                  </AppLayout>
                }
              />
              <Route
                path="/student/homework/list"
                element={
                  <AppLayout>
                    <StudentHomeworkPage />
                  </AppLayout>
                }
              />
            </>
          )}

          <Route
            path="/settings"
            element={
              <AppLayout>
                <SettingsPage />
              </AppLayout>
            }
          />

          <Route
            path="/songslist"
            element={
              <AppLayout>
                <SongslistPage />
              </AppLayout>
            }
          />
        </>
      )}

      {/* Root redirect */}
      <Route
        path="/"
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
