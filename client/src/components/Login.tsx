import { useField } from '../hooks/useField'
import { useLogin } from '../hooks/useAuth'
import { useNavigate, useLocation } from 'react-router-dom'

export const Login = () => {
  const email = useField('text')
  const password = useField('password')
  const navigate = useNavigate()
  const location = useLocation()

  const loginMutation = useLogin({
    onSuccess: () => {
      console.log(`Login successful for ${email.value}`)
      const params = new URLSearchParams(location.search)
      const next = params.get('next') || '/'
      email.reset()
      password.reset()
      navigate(next, { replace: true })
    },
    onError: error => {
      console.error(error instanceof Error ? error.message : 'Login failed.')
    }
  })

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
    </div>
  )
}
