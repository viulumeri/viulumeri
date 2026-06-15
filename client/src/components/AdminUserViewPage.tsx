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
    <div className="space-y-4 p-5 pb-24">
      <h1 className="flex items-center gap-3">
        <UserRound className="w-8 h-8" />
        Käyttäjänäkymä
      </h1>

      <div className="bg-neutral-900 rounded-lg p-6 space-y-5">
        <p className="text-gray-300">
          Siirry tavalliseen käyttäjänäkymään (läksyt, kappaleet ja asetukset)
          tai kirjaudu ulos.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleEnterRegularUserView}
            className="button-basic"
          >
            Siirry käyttäjänäkymään
          </button>

          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="inline-flex justify-center items-center gap-2 bg-neutral-100 text-black rounded-full px-6 py-2 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-5 h-5" />
            {logout.isPending ? 'Kirjaudutaan ulos...' : 'Kirjaudu ulos'}
          </button>
        </div>
      </div>
    </div>
  )
}
