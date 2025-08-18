import { Login } from './components/Login.tsx'
import { Signup } from './components/SignUp.tsx'
import { MusicPlayer } from './components/MusicPlayer'
import { Songslist } from './components/Songslist'
import { InviteLink } from './components/InviteLink'
import { InviteAccept } from './components/InviteAccept'
import { TeacherStudents } from './components/TeacherStudents'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import { authClient, useSession } from './auth-client'
import type { AppSessionUser } from '../../shared/types'

const App = () => {
  const { data: session } = useSession()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate('/login')
        }
      }
    })
  }

  return (
    <div>
      <h1>Viulumeri</h1>

      <nav>
        {!session && (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Uusi käyttäjä</Link>
          </>
        )}

        {session && (
          <>
            <span>Tervetuloa, {session.user.email}!</span>
            <button onClick={handleSignOut}>Logout</button>
            <Link to="/songslist">Biisilista</Link>
            {/* Teippi*/}
            {(session?.user as unknown as AppSessionUser | undefined)
              ?.userType === 'teacher' && (
              <>
                <Link to="/invite">Lisää uusi oppilas</Link>
                <Link to="/teacher/students">Oppilaat</Link>
              </>
            )}
          </>
        )}
      </nav>

      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<h2>Etusivu placeholder</h2>} />
        <Route path="/songslist" element={<Songslist />} />
        <Route path="/player/:songId" element={<MusicPlayer />} />
        <Route path="/invite" element={<InviteLink />} />
        <Route path="/invite/:token" element={<InviteAccept />} />
        <Route path="/teacher/students" element={<TeacherStudents />} />
      </Routes>
    </div>
  )
}

export default App
