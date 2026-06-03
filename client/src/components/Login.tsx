import { useField } from '../hooks/useField'
import { useLogin } from '../hooks/useAuth'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
          className="button-basic hover:bg-gray-300 block mx-auto"
        >
          {loginMutation.isPending ? 'Kirjaudutaan…' : 'Kirjaudu sisään'}
        </button>
      </form>

      <div>
        <button type="button"
          onClick={() => navigate('/forgot-password')}
          className="back-button-basic hover:bg-white/10 block mx-auto mt-4"
        >
          Unohdin salasanani
        </button>
        <button type="button"
          onClick={() => navigate('/signup')}
          className="back-button-basic hover:bg-white/10 block mx-auto mt-4"
        >
          Luo uusi käyttäjä
        </button>
      </div>
    </div>
  )
}
