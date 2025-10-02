import { useField } from '../hooks/useField'
import { useRequestPasswordReset } from '../hooks/useAuth'
import { Link } from 'react-router-dom'

export const ForgotPassword = () => {
  const email = useField('email')

  const requestReset = useRequestPasswordReset({
    onSuccess: () => {
      email.reset()
    },
    onError: error => {
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
      <h2 className="mb-4">Unohdin salasanani</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <input
            {...email.props}
            placeholder="Sähköpostiosoite"
            autoComplete="email"
            className="w-full rounded-lg text-gray-100 px-3 py-2 border border-gray-400
                     focus:bg-white/10 placeholder-gray-400"
            required
          />
        </div>

        <button
          type="submit"
          disabled={requestReset.isPending}
          className="button-basic block mx-auto"
        >
          {requestReset.isPending ? 'Lähetetään…' : 'Lähetä palautuslinkki'}
        </button>
      </form>

      {requestReset.isError && (
        <div className="mt-3 text-sm text-red-300">
          {requestReset.error instanceof Error
            ? requestReset.error.message
            : 'Salasanan palautus epäonnistui'}
        </div>
      )}

      {requestReset.isSuccess && (
        <div className="mt-3 text-sm text-green-300">
          Palautuslinkki lähetetty sähköpostiin
        </div>
      )}

      <div className="mt-4 flex justify-center">
        <Link to="/login" className=" text-gray-300 hover:text-white underline">
          Takaisin kirjautumiseen
        </Link>
      </div>
    </div>
  )
}
