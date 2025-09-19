import { useState } from 'react'
import { authClient } from '../auth-client'

interface ResendVerificationProps {
  email: string
}

export const ResendVerification = ({ email }: ResendVerificationProps) => {
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')
  const [message, setMessage] = useState('')

  const handleResend = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const response = await authClient.sendVerificationEmail({
        email: email,
        fetchOptions: {
          onError: async context => {
            const { response } = context
            if (response.status === 429) {
              const retryAfter = response.headers.get('X-Retry-After')
              const seconds = retryAfter ? parseInt(retryAfter) : 60
              alert(
                `Liian monta pyyntöä. Yritä uudelleen ${seconds} sekunnin kuluttua.`
              )
            }
          }
        }
      })

      if (response.error) {
        setStatus('error')
        setMessage('Vahvistussähköpostin lähetys epäonnistui')
      } else {
        setStatus('success')
        setMessage('Vahvistussähköposti lähetetty!')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Virhe sähköpostin lähetyksessä')
    }
  }

  return (
    <div
      style={{
        marginTop: '20px',
        padding: '16px',
        border: '1px solid #ccc',
        borderRadius: '4px'
      }}
    >
      <h3>Lähetä vahvistussähköposti uudelleen</h3>
      <form onSubmit={handleResend}>
        <div>
          <strong>Sähköpostiosoite:</strong> {email}
        </div>
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          style={{ marginTop: '8px' }}
        >
          {status === 'loading'
            ? 'Lähetetään...'
            : status === 'success'
              ? 'Lähetetty!'
              : 'Lähetä vahvistussähköposti'}
        </button>
      </form>

      {status === 'success' && (
        <div style={{ color: 'green', marginTop: '8px' }}>{message}</div>
      )}

      {status === 'error' && (
        <div style={{ color: 'red', marginTop: '8px' }}>{message}</div>
      )}
    </div>
  )
}

