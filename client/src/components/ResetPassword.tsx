import { useField } from '../hooks/useField'
import { useResetPassword } from '../hooks/useAuth'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { useNotification } from '../hooks/useNotification'

export const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { showError, showSuccess } = useNotification()
  const hasShownError = useRef(false)
  
  const newPassword = useField('password')

  useEffect(() => {
    if (hasShownError.current) return
    
    const urlToken = searchParams.get('token')
    const urlError = searchParams.get('error')
    
    if (urlError === 'INVALID_TOKEN') {
      const errorMessage = 'Linkki on vanhentunut tai virheellinen'
      showError(errorMessage)
      setError(errorMessage)
      hasShownError.current = true
    } else if (urlToken) {
      setToken(urlToken)
    } else if (!urlToken) {
      const errorMessage = 'Virheellinen linkki'
      showError(errorMessage)
      setError(errorMessage)
      hasShownError.current = true
    }
  }, [searchParams, showError])

  const resetPassword = useResetPassword({
    onSuccess: () => {
      newPassword.reset()
      showSuccess('Salasana vaihdettu onnistuneesti!')
      navigate('/login')
    },
    onError: (error) => {
      showError(`Virhe: ${error.message}`)
    }
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!newPassword.value) {
      showError('Syötä uusi salasana')
      return
    }
    if (!token) {
      showError('Virheellinen linkki')
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
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
        <div>
          <Link to="/forgot-password">
            Pyydä uusi palautuslinkki
          </Link>
          <Link to="/login">
            Takaisin kirjautumiseen
          </Link>
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
      
      <div>
        <Link to="/login">
          Takaisin kirjautumiseen
        </Link>
      </div>
    </div>
  )
}