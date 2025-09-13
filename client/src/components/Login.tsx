import { useField } from '../hooks/useField'
import { useLogin } from '../hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { useSession } from '../auth-client'
import { useEffect } from 'react'

export const Login = () => {
  const email = useField('text')
  const password = useField('password')
  const navigate = useNavigate()
  const { data: session } = useSession()

  const loginMutation = useLogin({
    onSuccess: () => {
      console.log(`Login successful for ${email.value}`)
      email.reset()
      password.reset()
    },
    onError: error => {
      console.error(error instanceof Error ? error.message : 'Login failed.')
      password.reset()
    }
  })

  useEffect(() => {
    if (session) {
      navigate('/', { replace: true })
    }
  }, [session, navigate])

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault()
    loginMutation.mutate({
      email: email.value,
      password: password.value
    })
  }

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          email <input {...email.props} />
        </div>
        <div>
          password <input {...password.props} />
        </div>
        <button type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Logging in..' : 'Log in'}
        </button>
      </form>
      {loginMutation.isError && (
        <div style={{ color: 'red' }}>
          {loginMutation.error instanceof Error
            ? loginMutation.error.message
            : 'Login failed'}
        </div>
      )}
      {loginMutation.isSuccess && (
        <div style={{ color: 'green' }}>Login successful</div>
      )}
      <div>
        <Link to="/forgot-password">Unohdin salasanani</Link>
      </div>
    </div>
  )
}
