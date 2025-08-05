import { useField } from '../hooks/useField'
import { useSignUp } from '../hooks/useAuth'

export const Signup = () => {
  const email = useField('text')
  const password = useField('password')
  const name = useField('text')

  const signUpMutation = useSignUp({
    onSuccess: () => {
      console.log(`Sign up successful for ${name.value}`)
      email.reset()
      password.reset()
      name.reset()
    },
    onError: error => {
      console.error(error instanceof Error ? error.message : 'Sign up failed.')
    }
  })

  const handleSignUp = (event: React.FormEvent) => {
    event.preventDefault()
    signUpMutation.mutate({
      email: email.value,
      password: password.value,
      name: name.value
    })
  }
  return (
    <div>
      <h2>Sign up</h2>
      <form onSubmit={handleSignUp}>
        <div>
          email <input {...email.props} />
        </div>
        <div>
          password <input {...password.props} />
        </div>
        <div>
          name <input {...name.props} />
        </div>
        <button type="submit" disabled={signUpMutation.isPending}>
          {signUpMutation.isPending ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
      {signUpMutation.isError && (
        <div style={{ color: 'red' }}>
          {signUpMutation.error instanceof Error
            ? signUpMutation.error.message
            : 'Sign up failed'}
        </div>
      )}
      {signUpMutation.isSuccess && (
        <div style={{ color: 'green' }}>Sign up successful!</div>
      )}
    </div>
  )
}
