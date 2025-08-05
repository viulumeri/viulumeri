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

const App = () => {
  return (
    <div>
      <h1>Viulumeri</h1>

      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  )
}

export default App
