import { useState } from 'react'
import { useSession } from '../auth-client'
import { useDeleteUser, useChangePassword, useLogout } from '../hooks/useAuth'
import { useField } from '../hooks/useField'
import type { AppSessionUser } from '../../../shared/types'
import { StudentSettings } from './StudentSettings'
import { TeacherSettings } from './TeacherSettings'
import { User, Key, Settings, LogOut, Trash2 } from 'lucide-react'

export const SettingsPage = () => {
  const { data: session, isPending } = useSession()
  const [isDeleting, setIsDeleting] = useState(false)
  const currentPassword = useField('password')
  const newPassword = useField('password')
  const confirmPassword = useField('password')

  const deleteUser = useDeleteUser({
    onSuccess: () => {
      setIsDeleting(false)
      alert(
        'Vahvistussähköposti lähetetty. Tarkista sähköpostisi viimeistelläksesi tilin poistamisen.'
      )
    },
    onError: error => {
      setIsDeleting(false)
      alert(`Virhe tilin poistamisessa: ${error.message}`)
    }
  })

  const changePassword = useChangePassword({
    onSuccess: () => {
      currentPassword.reset()
      newPassword.reset()
      confirmPassword.reset()
      alert('Salasana vaihdettu onnistuneesti!')
    },
    onError: error => {
      alert(`Virhe salasanan vaihdossa: ${error.message}`)
    }
  })

  const logout = useLogout({
    onSuccess: () => {
      localStorage.removeItem('studentLastHomeworkRoute')
      window.location.href = '/login'
    },
    onError: error => {
      alert(`Virhe uloskirjautumisessa: ${error.message}`)
    }
  })

  if (isPending) {
    return <div>Ladataan...</div>
  }

  if (!session) {
    return <div>Ei istuntoa</div>
  }

  const userType = (session.user as unknown as AppSessionUser)?.userType

  const handleDeleteAccount = () => {
    if (
      confirm(
        'Haluatko varmasti poistaa käyttäjätilisi? Saat vahvistussähköpostin ennen lopullista poistamista.'
      )
    ) {
      setIsDeleting(true)
      deleteUser.mutate({ callbackURL: '/login' })
    }
  }

  const handleChangePassword = (event: React.FormEvent) => {
    event.preventDefault()
    if (
      !currentPassword.value ||
      !newPassword.value ||
      !confirmPassword.value
    ) {
      alert('Täytä kaikki salasanakentät')
      return
    }
    if (newPassword.value !== confirmPassword.value) {
      alert('Uudet salasanat eivät täsmää')
      return
    }
    changePassword.mutate({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
      revokeOtherSessions: true
    })
  }

  const handleLogout = () => {
    logout.mutate()
  }

  return (
    <div className="space-y-6 p-6 pb-24">
      <h2 className="flex items-center gap-3">
        <Settings className="w-8 h-8" />
        Asetukset
      </h2>

      <div className="flex justify-center">
        <button
          onClick={handleLogout}
          disabled={logout.isPending}
          className="flex items-center gap-2 button-basic disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="w-5 h-5" />
          {logout.isPending ? 'Kirjaudutaan ulos...' : 'Kirjaudu ulos'}
        </button>
      </div>

      <div className="bg-neutral-900 rounded-lg p-6">
        <h3 className="flex items-center gap-3 mb-4">
          <User className="w-6 h-6" />
          Käyttäjätiedot
        </h3>
        <div className="space-y-2 text-gray-300">
          <p>
            <strong className="text-gray-100">Sähköposti:</strong>{' '}
            {session.user.email}
          </p>
          <p>
            <strong className="text-gray-100">Tyyppi:</strong>{' '}
            {userType === 'teacher' ? 'Opettaja' : 'Oppilas'}
          </p>
        </div>
      </div>

      <div className="bg-neutral-900 rounded-lg p-6">
        <h3 className="flex items-center gap-3 mb-4">
          <Key className="w-6 h-6" />
          Salasanan vaihto
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label
              htmlFor="current-password"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Nykyinen salasana:
            </label>
            <input
              id="current-password"
              {...currentPassword.props}
              required
              autoComplete="current-password"
              className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label
              htmlFor="new-password"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Uusi salasana:
            </label>
            <input
              id="new-password"
              {...newPassword.props}
              required
              autoComplete="new-password"
              className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Kirjoita uusi salasana uudelleen:
            </label>
            <input
              id="confirm-password"
              {...confirmPassword.props}
              required
              autoComplete="new-password"
              className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={changePassword.isPending}
              className="button-basic disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {changePassword.isPending ? 'Vaihdetaan...' : 'Vaihda salasana'}
            </button>
          </div>
        </form>
      </div>

      {userType === 'teacher' && <TeacherSettings />}
      {userType === 'student' && <StudentSettings />}

      <div className="bg-neutral-900 rounded-lg p-6">
        <h3 className="flex items-center gap-3 mb-4">
          <Trash2 className="w-6 h-6 text-red-400" />
          Poista käyttäjätili
        </h3>
        <div className="space-y-4">
          <div className="flex justify-center">
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-full px-6 py-2 text-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-5 h-5" />
              {isDeleting ? 'Lähetetään vahvistusta...' : 'Poista käyttäjätili'}
            </button>
          </div>
          <p className="text-red-400 text-sm text-center">
            Varoitus: Tilin poistaminen poistaa kaikki tietosi pysyvästi.
          </p>
        </div>
      </div>
    </div>
  )
}
