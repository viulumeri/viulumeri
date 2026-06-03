import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useField } from '../hooks/useField'
import { useSignUp } from '../hooks/useAuth'
import { useNotification } from '../hooks/useNotification'

export const Signup = () => {
  const navigate = useNavigate()
  const email = useField('email')
  const password = useField('password')
  const confirmPassword = useField('password')
  const passwordsMatch = password.value === confirmPassword.value
  const firstName = useField('text')
  const lastName = useField('text')
  const [userType, setUserType] = useState<'teacher' | 'student'>('student')
  const { showError, showSuccess } = useNotification()
  const confirmTouched = confirmPassword.value.length > 0
  const showPasswordMismatch = confirmTouched && !passwordsMatch

  const signUpMutation = useSignUp({
    onSuccess: () => {
      showSuccess('Lähetimme vahvistusviestin sähköpostiisi. Tarkista sähköpostisi ja klikkaa vahvistuslinkkiä aktivoidaksesi tilisi.')
      navigate('/login')
    },
    onError: error => {
      const message = error instanceof Error ? error.message : 'Rekisteröityminen epäonnistui'
      showError(message)
    }
  })

  const handleSignUp = (event: React.FormEvent) => {
    event.preventDefault()

    if (signUpMutation.isPending) {
      return
    }
    if (!passwordsMatch) {
      showError('Salasanat eivät täsmää')
      return
    }

    signUpMutation.mutate({
      email: email.value,
      password: password.value,
      name: `${firstName.value} ${lastName.value}`.trim(),
      userType: userType
    })
  }
  return (
    <div>
      <h2 className="mx-auto w-fit mb-4">Luo uusi käyttäjä</h2>

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

        <div>
          <input
            {...confirmPassword.props}
            type="password"
            placeholder="Vahvista salasana"
            autoComplete="new-password"
            className={`w-full rounded-lg text-gray-100 px-3 py-2 border
              ${
                confirmTouched && !passwordsMatch
                  ? 'border-red-500'
                  : 'border-gray-400'
              }
              focus:bg-white/10 placeholder-gray-400`}
            required
          />

          {showPasswordMismatch && (
            <p className="mt-1 text-sm text-red-400">
              Salasanat eivät täsmää
            </p>
          )}
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
          disabled={signUpMutation.isPending || !passwordsMatch || !password.value || !confirmPassword.value}
          className="button-basic block mx-auto"
        >
          {signUpMutation.isPending ? 'Luodaan…' : 'Rekisteröidy'}
        </button>
      </form>

      <button type="button"
        onClick={() => navigate('/login')}
        className="back-button-basic block mx-auto mt-4"
      >
        Takaisin
      </button>
    </div>
  )
}
