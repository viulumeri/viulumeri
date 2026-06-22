import { UserRound, LogOut } from 'lucide-react'
import { useNotification } from '../hooks/useNotification'
import { useLogout } from '../hooks/useAuth'
import { enableAdminRegularUserView } from '../utils/adminRegularUserView'

export const AdminUserViewPage = () => {
  const { showError } = useNotification()

  const logout = useLogout({
    onSuccess: () => {
      localStorage.removeItem('studentLastHomeworkRoute')
      window.location.href = '/login'
    },
    onError: error => {
      showError(`Virhe uloskirjautumisessa: ${error.message}`)
    }
  })

  const handleEnterRegularUserView = () => {
    enableAdminRegularUserView()
    window.location.href = '/student/homework'
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">
        <UserRound className="admin-page-title-icon" />
        Käyttäjänäkymä
      </h1>

      <div className="admin-card space-y-5">
        <p className="text-gray-300">
          Siirry tavalliseen käyttäjänäkymään (läksyt, kappaleet ja asetukset)
          tai kirjaudu ulos.
        </p>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={handleEnterRegularUserView}
            className="button-basic max-w-full text-center"
          >
            Siirry käyttäjänäkymään
          </button>

          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="button-basic inline-flex max-w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut className="w-5 h-5" />
            {logout.isPending ? 'Kirjaudutaan ulos...' : 'Kirjaudu ulos'}
          </button>
        </div>
      </div>
    </div>
  )
}
