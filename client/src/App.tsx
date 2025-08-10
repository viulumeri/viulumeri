import { Login } from './components/Login.tsx'
import { Signup } from './components/SignUp.tsx'
import {
  BrowserRouter as Router,
  Link,
  Route,
  Routes,
  useMatch,
  useNavigate
} from 'react-router-dom'
import { authClient, useSession } from './auth-client'
import { Songlist } from './components/Songlist'

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
            <Link to="/songlist">Biisilista</Link>
          </>
        )}
      </nav>

      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<h2>Etusivu placeholder</h2>} />
        <Route path="/songlist" element={<Songlist />} />
      </Routes>
    </div>
  )
}

export default App
