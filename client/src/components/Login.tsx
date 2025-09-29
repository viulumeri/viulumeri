import { useField } from '../hooks/useField'
import { useLogin } from '../hooks/useAuth'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useSession } from '../auth-client'
import { useEffect, useState } from 'react'
import { ResendVerification } from './ResendVerification'

export const Login = () => {
  const email = useField('text')
  const password = useField('password')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { data: session } = useSession()
  const [showResend, setShowResend] = useState(false)

  const loginMutation = useLogin({
    onSuccess: () => {
      console.log(`Login successful for ${email.value}`)
      email.reset()
      password.reset()
    },
    onError: error => {
      console.error(error instanceof Error ? error.message : 'Login failed.')
      password.reset()

      if (
        error instanceof Error &&
        error.message.includes('Sähköposti ei ole vahvistettu')
      ) {
        setShowResend(true)
      }
    }
  })

  useEffect(() => {
    if (session) {
      const nextPath = searchParams.get('next') || '/'
      navigate(nextPath, { replace: true })
    }
  }, [session, navigate, searchParams])

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

      {showResend && <ResendVerification email={email.value} />}
    </div>
  )
}
