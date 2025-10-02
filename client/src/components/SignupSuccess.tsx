import { Link } from 'react-router-dom'

export const SignupSuccess = () => {
  return (
    <div>
      <h2>Käyttäjän luominen onnistui</h2>
      <div className="p-2 mb-2 text-gray-400">
        Lähetimme vahvistusviestin sähköpostiisi. Tarkista sähköpostisi ja
        klikkaa vahvistuslinkkiä aktivoidaksesi tilisi.
      </div>
      <div className="flex justify-center">
        <Link
          to="/login"
          className="button-basic text-black inline-flex items-center justify-center no-underline"
        >
          <button>Siirry kirjautumaan</button>
        </Link>
      </div>
    </div>
  )
}
