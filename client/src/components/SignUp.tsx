import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useField } from '../hooks/useField'
import { useSignUp } from '../hooks/useAuth'

export const Signup = () => {
  const navigate = useNavigate()
  const email = useField('email')
  const password = useField('password')
  const firstName = useField('text')
  const lastName = useField('text')
  const [userType, setUserType] = useState<'teacher' | 'student'>('student')
  const [messageStatus, setMessageStatus] = useState<'error' | null>(null)

  const signUpMutation = useSignUp({
    onSuccess: () => {
      navigate('/signup-success')
    },
    onError: error => {
      console.error(error instanceof Error ? error.message : 'Sign up failed.')
      setMessageStatus('error')
    }
  })

  const handleSignUp = (event: React.FormEvent) => {
    event.preventDefault()

    if (signUpMutation.isPending) {
      return
    }

    setMessageStatus(null)
    signUpMutation.mutate({
      email: email.value,
      password: password.value,
      name: `${firstName.value} ${lastName.value}`.trim(),
      userType: userType
    })
  }
  return (
    <div>
      <form onSubmit={handleSignUp} className="space-y-3">
        <div>
          <input
            {...firstName.props}
            placeholder="Etunimi"
            autoComplete="given-name"
            className="w-full rounded-lg text-gray-100 px-3 py-2 border border-gray-400
                     focus:bg-white/10 placeholder-gray-400"
            required
          />
        </div>

        <div>
          <input
            {...lastName.props}
            placeholder="Sukunimi"
            autoComplete="family-name"
            className="w-full rounded-lg text-gray-100 px-3 py-2 border border-gray-400
                     focus:bg-white/10 placeholder-gray-400"
            required
          />
        </div>

        <div>
          <input
            {...email.props}
            type="email"
            inputMode="email"
            placeholder="Sähköpostiosoite"
            autoComplete="email"
            className="w-full rounded-lg text-gray-100 px-3 py-2 border border-gray-400
                     focus:bg-white/10 placeholder-gray-400"
            required
          />
        </div>

        <div>
          <input
            {...password.props}
            type="password"
            placeholder="Salasana"
            autoComplete="new-password"
            className="w-full rounded-lg text-gray-100 px-3 py-2 border border-gray-400
                     focus:bg-white/10 placeholder-gray-400"
            required
          />
        </div>

        <fieldset className="mt-2 ml-2 flex items-center gap-4 text-sm">
          <div className="text-gray-300">Olen:</div>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="userType"
              value="student"
              checked={userType === 'student'}
              onChange={e =>
                setUserType(e.target.value as 'teacher' | 'student')
              }
              className="accent-sky-400"
            />
            Oppilas
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="userType"
              value="teacher"
              checked={userType === 'teacher'}
              onChange={e =>
                setUserType(e.target.value as 'teacher' | 'student')
              }
              className="accent-sky-400"
            />
            Opettaja
          </label>
        </fieldset>

        <button
          type="submit"
          disabled={signUpMutation.isPending}
          className="button-basic block mx-auto"
        >
          {signUpMutation.isPending ? 'Luodaan…' : 'Luo uusi käyttäjä'}
        </button>
      </form>

      {messageStatus === 'error' && (
        <div className="mt-3 text-sm text-red-300">
          {signUpMutation.error instanceof Error
            ? signUpMutation.error.message
            : 'Rekisteröityminen epäonnistui'}
        </div>
      )}
    </div>
  )
}
