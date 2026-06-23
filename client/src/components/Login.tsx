import { useField } from '../hooks/useField'
import { useLogin } from '../hooks/useAuth'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSession } from '../auth-client'
import { useEffect } from 'react'
import { useNotification } from '../hooks/useNotification'
import { disableAdminRegularUserView } from '../utils/adminRegularUserView'

export const Login = () => {
  const email = useField('email')
  const password = useField('password')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { data: session } = useSession()
  const { showError } = useNotification()

  const loginMutation = useLogin({
    onError: error => {
      const message = error instanceof Error ? error.message : 'Kirjautuminen epäonnistui'
      showError(message)
      password.reset()
    }
  })

  useEffect(() => {
    if (session) {
      const role = (session.user as { role?: string } | undefined)?.role
      if (role === 'admin') {
        disableAdminRegularUserView()
      }
      const nextPath = role === 'admin' ? '/admin' : searchParams.get('next') || '/'
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
          className="button-basic active:bg-gray-300 block mx-auto"
        >
          {loginMutation.isPending ? 'Kirjaudutaan…' : 'Kirjaudu sisään'}
        </button>
      </form>

      <div className="flex flex-col items-center sm:flex-row justify-center gap-8 mt-4 font-size-sm">
        <button type="button"
          onClick={() => navigate('/forgot-password')}
          className="font-normal text-gray-100 underline underline-offset-4 transition-all duration-200 hover:text-white hover:underline-offset-6 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70"
        >
          Unohdin salasanani
        </button>
        <button type="button"
          onClick={() => navigate('/signup')}
          className="font-normal text-gray-100 underline underline-offset-4 transition-all duration-200 hover:text-white hover:underline-offset-6 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70"
        >
          Luo uusi käyttäjä
        </button>
      </div>
    </div>
  )
}
