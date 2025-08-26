import { useState } from 'react'
import { useSession } from '../auth-client'
import { useDeleteUser, useChangePassword } from '../hooks/useAuth'
import { useField } from '../hooks/useField'
import type { AppSessionUser } from '../../../shared/types'

export const SettingsPage = () => {
  const { data: session } = useSession()
  const [isDeleting, setIsDeleting] = useState(false)
  const currentPassword = useField('password')
  const newPassword = useField('password')
  
  const deleteUser = useDeleteUser({
    onSuccess: () => {
      setIsDeleting(false)
      alert('Vahvistussähköposti lähetetty. Tarkista sähköpostisi viimeistelläksesi tilin poistamisen.')
    },
    onError: (error) => {
      setIsDeleting(false)
      alert(`Virhe tilin poistamisessa: ${error.message}`)
    }
  })

  const changePassword = useChangePassword({
    onSuccess: () => {
      currentPassword.reset()
      newPassword.reset()
      alert('Salasana vaihdettu onnistuneesti!')
    },
    onError: (error) => {
      alert(`Virhe salasanan vaihdossa: ${error.message}`)
    }
  })
  
  if (!session) {
    return <div>Ei istuntoa</div>
  }

  const userType = (session.user as unknown as AppSessionUser)?.userType

  const handleDeleteAccount = () => {
    if (confirm('Haluatko varmasti poistaa käyttäjätilisi? Saat vahvistussähköpostin ennen lopullista poistamista.')) {
      setIsDeleting(true)
      deleteUser.mutate({ callbackURL: '/login' })
    }
  }

  const handleChangePassword = (event: React.FormEvent) => {
    event.preventDefault()
    if (!currentPassword.value || !newPassword.value) {
      alert('Täytä molemmat salasanakentät')
      return
    }
    changePassword.mutate({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
      revokeOtherSessions: true
    })
  }

  return (
    <div>
      <h2>Asetukset</h2>
      
      <div>
        <h3>Käyttäjätiedot</h3>
        <p><strong>Sähköposti:</strong> {session.user.email}</p>
        <p><strong>Tyyppi:</strong> {userType === 'teacher' ? 'Opettaja' : 'Oppilas'}</p>
      </div>

      <div>
        <h3>Salasanan vaihto</h3>
        <form onSubmit={handleChangePassword}>
          <div>
            <label htmlFor="current-password">Nykyinen salasana:</label>
            <input id="current-password" {...currentPassword.props} required />
          </div>
          <div>
            <label htmlFor="new-password">Uusi salasana:</label>
            <input id="new-password" {...newPassword.props} required />
          </div>
          <button type="submit" disabled={changePassword.isPending}>
            {changePassword.isPending ? 'Vaihdetaan...' : 'Vaihda salasana'}
          </button>
        </form>
      </div>

      <div>
        <h3>Tilin hallinta</h3>
        <button onClick={handleDeleteAccount} disabled={isDeleting}>
          {isDeleting ? 'Lähetetään vahvistusta...' : 'Poista käyttäjätili'}
        </button>
        <p>Varoitus: Tilin poistaminen poistaa kaikki tietosi pysyvästi.</p>
      </div>

      {userType === 'teacher' && (
        <div>
          <h3>Oppilaiden hallinta</h3>
          <p>TODO: Oppilaiden poistaminen</p>
        </div>
      )}

      {userType === 'student' && (
        <div>
          <h3>Opettajan hallinta</h3>
          <p>TODO: Opettajan poistaminen</p>
        </div>
      )}
    </div>
  )
}