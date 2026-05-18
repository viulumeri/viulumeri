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
        <h2 className="mb-4">Salasanan vaihto</h2>
        <div className="text-sm text-red-300 mb-4">{error}</div>
        <div className="space-y-2">
          <Link to="/forgot-password" className="text-gray-300 hover:text-white underline">
            Pyydä uusi palautuslinkki
          </Link>
          <Link to="/login" className="text-gray-300 hover:text-white underline">
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

      {resetPassword.isError && (
        <div className="mt-3 text-sm text-red-300">
          {resetPassword.error instanceof Error
            ? resetPassword.error.message
            : 'Salasanan vaihto epäonnistui'}
        </div>
      )}

      <div className="mt-4 flex justify-center">
        <Link to="/login" className="text-gray-300 hover:text-white underline">
          Takaisin kirjautumiseen
        </Link>
      </div>
    </div>
  )
}