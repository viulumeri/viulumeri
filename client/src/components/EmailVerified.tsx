import { Link, useSearchParams } from 'react-router-dom'
import { ResendVerification } from './ResendVerification'

export const EmailVerified = () => {
  const [searchParams] = useSearchParams()
  const error = searchParams.get('error')

  if (error === 'invalid_token') {
    return (
      <div>
        <h2>Vahvistus epäonnistui</h2>
        <div style={{ color: 'red', marginBottom: '16px' }}>
          Vahvistuslinkki on vanhentunut tai virheellinen.
        </div>
        <div>
          <ResendVerification />
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
      <div style={{ color: 'green', marginBottom: '16px' }}>
        Sähköpostiosoitteesi on vahvistettu onnistuneesti. Voit nyt kirjautua
        palveluun.
      </div>
      <div>
        <Link to="/login">Siirry kirjautumaan</Link>
      </div>
    </div>
  )
}

