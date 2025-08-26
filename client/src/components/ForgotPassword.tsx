import { useField } from '../hooks/useField'
import { useRequestPasswordReset } from '../hooks/useAuth'
import { Link } from 'react-router-dom'

export const ForgotPassword = () => {
  const email = useField('email')

  const requestReset = useRequestPasswordReset({
    onSuccess: () => {
      email.reset()
      alert('Salasanan palautuslinkki lähetetty sähköpostiin!')
    },
    onError: (error) => {
      alert(`Virhe: ${error.message}`)
    }
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!email.value) {
      alert('Syötä sähköpostiosoite')
      return
    }
    
    requestReset.mutate({
      email: email.value,
      redirectTo: `${window.location.origin}/reset-password`
    })
  }

  return (
    <div>
      <h2>Unohdin salasanani</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Sähköpostiosoite:</label>
          <input id="email" {...email.props} required />
        </div>
        <button type="submit" disabled={requestReset.isPending}>
          {requestReset.isPending ? 'Lähetetään...' : 'Lähetä palautuslinkki'}
        </button>
      </form>
      
      {requestReset.isError && (
        <div style={{ color: 'red' }}>
          {requestReset.error instanceof Error
            ? requestReset.error.message
            : 'Salasanan palautus epäonnistui'}
        </div>
      )}
      
      {requestReset.isSuccess && (
        <div style={{ color: 'green' }}>
          Palautuslinkki lähetetty sähköpostiin
        </div>
      )}
      
      <div>
        <Link to="/login">Takaisin kirjautumiseen</Link>
      </div>
    </div>
  )
}