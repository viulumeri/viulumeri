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
        <h2 className="mb-4">Salasanan vaihto</h2>
        <div className="text-sm text-red-300 mb-4">{error}</div>
        <div className="space-y-2">
          <Link to="/forgot-password" className="block text-gray-300 hover:text-white underline">
            Pyydä uusi palautuslinkki
          </Link>
          <Link to="/login" className="block text-gray-300 hover:text-white underline">
            Takaisin kirjautumiseen
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-4">Aseta uusi salasana</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="new-password" className="block mb-2 text-sm text-gray-300">
            Uusi salasana:
          </label>
          <input
            id="new-password"
            {...newPassword.props}
            required
            className="w-full rounded-lg text-gray-100 px-3 py-2 border border-gray-400 focus:bg-white/10 placeholder-gray-400"
          />
        </div>
        <button type="submit" disabled={resetPassword.isPending} className="button-basic block mx-auto">
          {resetPassword.isPending ? 'Vaihdetaan...' : 'Vaihda salasana'}
        </button>
      </form>
      

      <div className="mt-4 flex justify-center">
        <Link to="/login" className="text-gray-300 hover:text-white underline">
          Takaisin kirjautumiseen
        </Link>
      </div>
    </div>
  )
}