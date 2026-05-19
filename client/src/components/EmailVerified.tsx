import { Link, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useNotification } from '../hooks/useNotification'

export const EmailVerified = () => {
  const [searchParams] = useSearchParams()
  const error = searchParams.get('error')
  const { showError, showSuccess } = useNotification()

  useEffect(() => {
    if (error === 'invalid_token') {
      showError('Vahvistuslinkki on vanhentunut tai virheellinen.')
    } else {
      showSuccess('Sähköpostiosoitteesi on vahvistettu onnistuneesti. Voit nyt kirjautua palveluun.')
    }
  }, [error, showError, showSuccess])

  if (error === 'invalid_token') {
    return (
      <div>
        <h2>Vahvistus epäonnistui</h2>
        <div style={{ color: 'red', marginBottom: '16px' }}>
          Vahvistuslinkki on vanhentunut tai virheellinen.
        </div>
        <div style={{ marginBottom: '16px' }}>
            Kirjaudu sisään saadaksesi uuden vahvistuslinkin.
        </div>
        <div>
          <Link to="/login">Takaisin kirjautumiseen</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2>Sähköposti vahvistettu!</h2>
      <div>
        <Link to="/login">
          Siirry kirjautumaan
        </Link>
      </div>
    </div>
  )
}

