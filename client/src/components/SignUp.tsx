import { useState } from 'react'
import { useField } from '../hooks/useField'
import { useSignUp } from '../hooks/useAuth'

export const Signup = () => {
  const email = useField('email')
  const password = useField('password')
  const name = useField('text')
  const [userType, setUserType] = useState<'teacher' | 'student'>('student')
  const [messageStatus, setMessageStatus] = useState<'success' | 'error' | null>(null)

  const signUpMutation = useSignUp({
    onSuccess: () => {
      console.log(`Sign up successful for ${name.value}`)
      setMessageStatus('success')
      email.reset()
      password.reset()
      name.reset()
      setUserType('student')
    },
    onError: error => {
      console.error(error instanceof Error ? error.message : 'Sign up failed.')
      setMessageStatus('error')
    }
  })

  const handleSignUp = (event: React.FormEvent) => {
    event.preventDefault()
    setMessageStatus(null)
    signUpMutation.mutate({
      email: email.value,
      password: password.value,
      name: name.value,
      userType: userType
    })
  }
  return (
    <div>
      <h2>Luo uusi tunnus</h2>
      <form onSubmit={handleSignUp}>
        <div>
          <label htmlFor="email">Email:</label>
          <input id="email" {...email.props} required />
        </div>
        <div>
          <label htmlFor="password">Salasana:</label>
          <input id="password" {...password.props} required />
        </div>
        <div>
          <label htmlFor="name">Nimi:</label>
          <input id="name" {...name.props} required />
        </div>
        <fieldset>
          <legend>Olen:</legend>
          <label>
            <input
              type="radio"
              name="userType"
              value="student"
              checked={userType === 'student'}
              onChange={e =>
                setUserType(e.target.value as 'teacher' | 'student')
              }
            />
            Oppilas
          </label>
          <label>
            <input
              type="radio"
              name="userType"
              value="teacher"
              checked={userType === 'teacher'}
              onChange={e =>
                setUserType(e.target.value as 'teacher' | 'student')
              }
            />
            Opettaja
          </label>
        </fieldset>
        <button type="submit" disabled={signUpMutation.isPending}>
          {signUpMutation.isPending ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
      {messageStatus === 'error' && (
        <div style={{ color: 'red' }}>
          {signUpMutation.error instanceof Error
            ? signUpMutation.error.message
            : 'Sign up failed'}
        </div>
      )}
      {messageStatus === 'success' && (
        <div style={{ color: 'green' }}>
          Käyttäjän lisäys onnistui. Vahvistuspyyntö on lähetetty sähköpostiisi.
        </div>
      )}
    </div>
  )
}
