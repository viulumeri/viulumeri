import { useField } from '../hooks/useField'
import { useLogin } from '../hooks/useAuth'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useSession } from '../auth-client'
import { useEffect } from 'react'
import { useNotification } from '../hooks/useNotification'

export const Login = () => {
  const email = useField('email')
  const password = useField('password')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { data: session } = useSession()
  const { showError, showSuccess } = useNotification()

  const loginMutation = useLogin({
    onSuccess: () => {
      showSuccess('Kirjautuminen onnistui')
    },
    onError: error => {
      const message = error instanceof Error ? error.message : 'Kirjautuminen epäonnistui'
      showError(message)
      password.reset()
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
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <input
            {...email.props}
            autoComplete="email"
            placeholder="Sähköpostiosoite"
            className="w-full rounded-lg text-gray-100 px-3 py-2 border-1 border-gray-400
                    focus:bg-white/5 placeholder-gray-400"
            required
          />
        </div>

        <div>
          <input
            {...password.props}
            autoComplete="current-password"
            placeholder="Salasana"
            className="w-full rounded-lg text-gray-100 px-3 py-2 border-1 border-gray-400
                    focus:bg-white/5 placeholder-gray-400"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="button-basic block mx-auto"
        >
          {loginMutation.isPending ? 'Kirjaudutaan…' : 'Kirjaudu sisään'}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        <Link
          to="/forgot-password"
          className="text-gray-300 hover:text-white underline"
        >
          Unohdin salasanani
        </Link>
        <Link to="/signup" className="text-gray-300 hover:text-white underline">
          Luo uusi käyttäjä
        </Link>
      </div>
    </div>
  )
}
