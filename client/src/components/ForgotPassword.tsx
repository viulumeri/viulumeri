import { useField } from '../hooks/useField'
import { useRequestPasswordReset } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useNotification } from '../hooks/useNotification'

export const ForgotPassword = () => {
  const email = useField('email')
  const navigate = useNavigate()
  const { showError, showSuccess } = useNotification()

  const requestReset = useRequestPasswordReset({
    onSuccess: () => {
      email.reset()
      showSuccess('Palautuslinkki lähetetty sähköpostiin')
    },
    onError: error => {
      showError(`Virhe: ${error.message}`)
    }
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!email.value) {
      showError('Syötä sähköpostiosoite')
      return
    }
    requestReset.mutate({
      email: email.value,
      redirectTo: `${window.location.origin}/reset-password`
    })
  }

  return (
    <div>
      <h2 className="mx-auto w-fit mb-4">Unohdin salasanani</h2>

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
          className="button-basic active:bg-gray-300 block mx-auto"
        >
          {requestReset.isPending ? 'Lähetetään…' : 'Lähetä palautuslinkki'}
        </button>
      </form>

      <div>
        <button type="button"
          onClick={() => navigate('/login')}
        className="font-normal text-gray-100 underline underline-offset-4 transition-all duration-200 hover:text-white hover:underline-offset-6 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70 mx-auto mt-4 block"
        >
          Takaisin
        </button>
      </div>
    </div>
  )
}
