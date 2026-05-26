import { useState } from 'react'
import { useSession } from '../auth-client'
import { useDeleteUser, useChangePassword, useChangeEmail, useLogout } from '../hooks/useAuth'
import { useField } from '../hooks/useField'
import type { AppSessionUser } from '../../../shared/types'
import { StudentSettings } from './StudentSettings'
import { TeacherSettings } from './TeacherSettings'
import { User, Key, Settings, LogOut, Trash2, Mail, MessageCircle } from 'lucide-react'
import { useNotification } from '../hooks/useNotification'

import { Link } from 'react-router-dom'
export const SettingsPage = () => {
  const { data: session, isPending } = useSession()
  const [isDeleting, setIsDeleting] = useState(false)
  const currentPassword = useField('password')
  const newPassword = useField('password')
  const confirmPassword = useField('password')
  const newEmail = useField('email')
  const confirmEmail = useField('email')
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const { showError, showSuccess } = useNotification()

  const deleteUser = useDeleteUser({
    onSuccess: () => {
      setIsDeleting(false)
      showSuccess(
        'Vahvistussähköposti lähetetty. Tarkista sähköpostisi viimeistelläksesi tilin poistamisen.'
      )
    },
    onError: error => {
      setIsDeleting(false)
      showError(`Virhe tilin poistamisessa: ${error.message}`)
    }
  })

  const changePassword = useChangePassword({
    onSuccess: () => {
      currentPassword.reset()
      newPassword.reset()
      confirmPassword.reset()
      showSuccess('Salasana vaihdettu onnistuneesti!')
    },
    onError: error => {
      showError(`Virhe salasanan vaihdossa: ${error.message}`)
    }
  })

  const changeEmail = useChangeEmail({
    onSuccess: () => {
      newEmail.reset()
      confirmEmail.reset()

    showSuccess('Sähköpostiosoite vaihdettu onnistuneesti!')
  },

  onError: (error: Error) => {
    showError(`Virhe sähköpostiosoitteen vaihdossa: ${error.message}`)
  },
})


  const logout = useLogout({
    onSuccess: () => {
      localStorage.removeItem('studentLastHomeworkRoute')
      window.location.href = '/login'
    },
    onError: error => {
      showError(`Virhe uloskirjautumisessa: ${error.message}`)
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
      deleteUser.mutate()
    }
  }

  const handleChangePassword = (event: React.FormEvent) => {
    event.preventDefault()
    if (
      !currentPassword.value ||
      !newPassword.value ||
      !confirmPassword.value
    ) {
      showError('Täytä kaikki salasanakentät')
      return
    }
    if (newPassword.value !== confirmPassword.value) {
      showError('Uudet salasanat eivät täsmää')
      return
    }
    changePassword.mutate({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
      revokeOtherSessions: true
    })
  }

 const handleChangeEmail = (event: React.FormEvent) => {
  event.preventDefault();

  changeEmail.mutate({
    newEmail: newEmail.value,
    password: confirmEmail.value,
  });
};

  const handleLogout = () => {
    logout.mutate()
  }

  return (

    <div className="space-y-4 p-5 pb-24">
      <h2 className="flex items-center gap-3">
        <Settings className="w-8 h-8" />
        Asetukset
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
      <div className="bg-neutral-900 rounded-lg p-2 -mb-4">
        <h3 className="flex items-center gap-3 mb-5">
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
        <div className="bg-neutral-900 rounded-lg p-2 flex items-center justify-center">

          <div className="flex justify-start">
        <button
          onClick={handleLogout}
          disabled={logout.isPending}
            className="inline-flex justify-center items-center gap-2 bg-neutral-100 text-black rounded-full
            px-6 py-2 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="w-5 h-5" />
          {logout.isPending ? 'Kirjaudutaan ulos...' : 'Kirjaudu ulos'}

        </button>
        </div>
      </div>
    </div>

      <div className="bg-neutral-900 rounded-lg p-3">
        <button
          type="button"
          onClick={() => setPasswordOpen(!passwordOpen)}
          className="w-full flex items-center justify-between gap-3 mb-1
          bg-neutral-800 hover:bg-neutral-700 border border-neutral-700
          rounded-md px-4 py-3 text-left transition-colors"
        >
          <span className="flex items-center gap-3">
            <Key className="w-6 h-6" />
            Salasanan vaihto
          </span>

          <span
            className={`transition-transform duration-200 ${
              passwordOpen ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </button>
        {passwordOpen && (
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
              className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2
              text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2
              text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2
              text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={changePassword.isPending}
              className="button-basic disabled:opacity-50 rounded-full px-6 py-2 disabled:cursor-not-allowed"
            >
              {changePassword.isPending ? 'Vaihdetaan...' : 'Vaihda salasana'}
            </button>
          </div>
        </form>
        )}
      </div>

       <div className="bg-neutral-900 rounded-lg p-3 mb-4">
        <button
          type="button"
          onClick={() => setEmailOpen(!emailOpen)}
          className="w-full flex items-center justify-between gap-3 mb-4
          bg-neutral-800 hover:bg-neutral-700 border border-neutral-700
          rounded-md px-4 py-3 text-left transition-colors"
        >
          <span className="flex items-center gap-3">
            <Mail className="w-6 h-6" />
            Sähköpostiosoitteen vaihto
          </span>

          <span
            className={`transition-transform duration-200 ${
              emailOpen ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </button>
        {emailOpen && (
        <form onSubmit={handleChangeEmail} className="space-y-4">
          <div>
            <label
              htmlFor="new-password"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Uusi sähköpostiosoite:
            </label>
            <input
              id="new-password"
              {...newEmail.props}
              required
              autoComplete="new-password"
              className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2
              text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Vahvista kirjoittamalla salasana:
            </label>
            <input
              id="confirm-password"
              {...confirmEmail.props}
              required
              autoComplete="new-password"
              className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2
              text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={changeEmail.isPending}
              className="button-basic disabled:opacity-50 rounded-full px-6 py-2 disabled:cursor-not-allowed"
            >
              {changeEmail.isPending ? 'Vaihdetaan...' : 'Vaihda sähköpostiosoite'}
            </button>
          </div>
        </form>
        )}
      </div>

      <div className="bg-neutral-900 rounded-lg p-3">
        <h3 className="flex items-center gap-3 mb-4">
          <MessageCircle className="w-6 h-6" />
          Palaute
        </h3>
        <div className="flex justify-center">
          <Link
            to="/feedback"
            className="button-basic inline-flex items-center justify-center px-6 py-2 text-xl rounded-full"
          >
            Anna palautetta
          </Link>
        </div>
      </div>

      {userType === 'teacher' && <TeacherSettings />}
      {userType === 'student' && <StudentSettings />}

      <div className="bg-neutral-900 rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex justify-center">
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-full
              px-6 py-2 text-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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

      <p className="text-right text-xs text-gray-500">Versio: {__APP_VERSION__}</p> {/* Näytä (clientin) versio asetuksissa */}
      {__BUILD_TIME__ && (
        <p className="text-right text-xs text-gray-500">
          Viimeksi päivitetty:{' '}
          {Number.isNaN(Date.parse(__BUILD_TIME__))
            ? __BUILD_TIME__
            : new Date(__BUILD_TIME__).toLocaleString('fi-FI')}
        </p>
      )}
    </div>
  )
}
