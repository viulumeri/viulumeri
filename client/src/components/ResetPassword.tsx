import { useField } from '../hooks/useField'
import { useResetPassword } from '../hooks/useAuth'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

export const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const newPassword = useField('password')

  useEffect(() => {
    const urlToken = searchParams.get('token')
    const urlError = searchParams.get('error')
    
    if (urlError === 'INVALID_TOKEN') {
      setError('Linkki on vanhentunut tai virheellinen')
    } else if (urlToken) {
      setToken(urlToken)
    } else {
      setError('Virheellinen linkki')
    }
  }, [searchParams])

  const resetPassword = useResetPassword({
    onSuccess: () => {
      newPassword.reset()
      alert('Salasana vaihdettu onnistuneesti!')
      navigate('/login')
    },
    onError: (error) => {
      alert(`Virhe: ${error.message}`)
    }
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!newPassword.value) {
      alert('Syötä uusi salasana')
      return
    }
    if (!token) {
      alert('Virheellinen linkki')
      return
    }
    
    resetPassword.mutate({
      newPassword: newPassword.value,
      token
    })
  }

  if (error) {
    return (
      <div>
        <h2>Salasanan vaihto</h2>
        <div style={{ color: 'red' }}>
          {error}
        </div>
        <div>
          <Link to="/forgot-password">Pyydä uusi palautuslinkki</Link>
        </div>
        <div>
          <Link to="/login">Takaisin kirjautumiseen</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2>Aseta uusi salasana</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="new-password">Uusi salasana:</label>
          <input id="new-password" {...newPassword.props} required />
        </div>
        <button type="submit" disabled={resetPassword.isPending}>
          {resetPassword.isPending ? 'Vaihdetaan...' : 'Vaihda salasana'}
        </button>
      </form>
      
      {resetPassword.isError && (
        <div style={{ color: 'red' }}>
          {resetPassword.error instanceof Error
            ? resetPassword.error.message
            : 'Salasanan vaihto epäonnistui'}
        </div>
      )}
      
      <div>
        <Link to="/login">Takaisin kirjautumiseen</Link>
      </div>
    </div>
  )
}