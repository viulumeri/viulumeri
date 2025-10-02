import { Link } from 'react-router-dom'

export const SignupSuccess = () => {
  return (
    <div>
      <h2>Käyttäjän luominen onnistui!</h2>
      <div style={{ color: 'green', marginBottom: '16px' }}>
        Käyttäjätunnus on luotu onnistuneesti. Vahvistuspyyntö on lähetetty sähköpostiisi.
        Tarkista sähköpostisi ja klikkaa vahvistuslinkkiä aktivoidaksesi tilisi.
      </div>
      <div>
        <Link to="/login">Siirry kirjautumaan</Link>
      </div>
    </div>
  )
}