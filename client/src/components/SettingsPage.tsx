import { useEffect, useState } from 'react'
import { useSession } from '../auth-client'
import { useDeleteUser, useChangePassword, useLogout } from '../hooks/useAuth'
import { useSubmitFeedback } from '../hooks/useFeedback'
import type { FeedbackCategory } from '../../../shared/types'
import { categoryLabel } from '../utils/feedbackLabels'
import { useField } from '../hooks/useField'
import type { AppSessionUser } from '../../../shared/types'
import { StudentSettings } from './StudentSettings'
import { TeacherSettings } from './TeacherSettings'
import { 
  User, 
  Key, 
  Settings, 
  LogOut, 
  Trash2, 
  FileQuestionMark, 
  MessageCircle, 
  Download, 
  ShieldCheck 
} from 'lucide-react'
import { useNotification } from '../hooks/useNotification'
import { faqService, type FAQ } from '../services/faq'
import { renderWithLinks } from "../utils/renderLinks"
import { PageContainer } from './PageContainer'
import { InstallPromptPopup } from './InstallPromptPopup'

export const SettingsPage = () => {
  const { data: session, isPending } = useSession()
  const [isDeleting, setIsDeleting] = useState(false)
  const currentPassword = useField('password')
  const newPassword = useField('password')
  const confirmPassword = useField('password')

  const [passwordOpen, setPasswordOpen] = useState(false)
  const [fqaOpen, setfqaOpen] = useState(false)
  const [instructionsOpen, setInstructionsOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)

  const [feedbackTitle, setFeedbackTitle] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory>('bug')
  const [feedbackWebsite, setFeedbackWebsite] = useState('')

  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [openFaqId, setOpenFaqId] = useState<string | null>(null)
  const { showError, showSuccess } = useNotification()
  const [showInstall, setShowInstall] = useState<'android' | 'ios' | null>(null)

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

  const submitFeedback = useSubmitFeedback({
    onSuccess: () => {
      showSuccess('Kiitos palautteesta!')
      setFeedbackTitle('')
      setFeedbackMessage('')
      setFeedbackCategory('bug')
      setFeedbackWebsite('')
      setFeedbackOpen(false)
    },
    onError: error => {
      showError(`Palautteen lähetys epäonnistui: ${error.message}`)
    }
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

  useEffect(() => {
    if (isPending || !session) return

    faqService.getFaqs().then(setFaqs).catch(error => {
      showError(`Virhe FAQ:ien lataamisessa: ${error.message}`)
    })
  }, [isPending, session, showError])

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

  const handleFeedbackSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const trimmedTitle = feedbackTitle.trim()
    if (!trimmedTitle) {
      showError('Kirjoita otsikko ennen lähettämistä')
      return
    }
    if (trimmedTitle.length > 200) {
      showError('Otsikko voi olla enintään 200 merkkiä')
      return
    }

    const trimmedMessage = feedbackMessage.trim()
    if (!trimmedMessage) {
      showError('Kirjoita palaute ennen lähettämistä')
      return
    }
    if (trimmedMessage.length < 5) {
      showError('Kirjoita vähintään 5 merkkiä palautteeseen')
      return
    }

    if (feedbackWebsite.trim()) {
      showError('Lähetys epäonnistui')
      return
    }

    submitFeedback.mutate({
      title: trimmedTitle,
      category: feedbackCategory,
      message: trimmedMessage,
      website: feedbackWebsite
    })
  }

  const handleLogout = () => {
    logout.mutate()
  }

  const visibleFaqs = faqs
    .filter((faq) => faq.question.trim())
    .sort(
      (a, b) =>
        new Date(a.createdAt ?? 0).getTime() -
        new Date(b.createdAt ?? 0).getTime()
    )

  return (
    <PageContainer>
      <h1 className="flex items-center gap-3">
        <Settings className="w-8 h-8" />
        Asetukset
      </h1>

      <div className="bg-neutral-900 rounded-lg py-2">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-3 mb-4">
              <User className="w-6 h-6" />
              Käyttäjätiedot
            </h2>
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
          <button
            onClick={handleLogout}
            disabled={logout.isPending}
            className="inline-flex justify-center items-center gap-2 bg-neutral-100 text-black rounded-full
            px-6 py-2 text-xl disabled:opacity-50 disabled:cursor-not-allowed self-center md:self-start"
          >
            <LogOut className="w-5 h-5" />
            {logout.isPending ? 'Kirjaudutaan ulos...' : 'Kirjaudu ulos'}
          </button>
        </div>
      </div>

      <div className="bg-neutral-900 rounded-lg py-3">
        <button
          type="button"
          onClick={() => setPasswordOpen(!passwordOpen)}
          className="w-full flex items-center justify-between gap-3 mb-1
          bg-neutral-800 hover:bg-neutral-700 border border-neutral-700
          rounded-md px-4 py-3 text-left transition-colors min-h-[58px]"
        >
          <span className="flex items-center gap-3">
            <Key className="w-6 h-6" />
            Salasanan vaihto
          </span>
          <span className={`transition-transform duration-200 ${passwordOpen ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>
        {passwordOpen && (
          <form onSubmit={handleChangePassword} className="space-y-4 mt-4 px-4 pb-2">
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-300 mb-1">
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
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-300 mb-1">
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
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-1">
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
            <div className="flex justify-center mt-2">
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

      <div className="bg-neutral-900 rounded-lg py-3 mb-4">
        <button
          type="button"
          onClick={() => setfqaOpen(!fqaOpen)}
          className="w-full flex items-center justify-between gap-3 mb-1
          bg-neutral-800 hover:bg-neutral-700 border border-neutral-700
          rounded-md px-4 py-3 text-left transition-colors min-h-[58px]"
        >
          <span className="flex items-center gap-3">
            <FileQuestionMark className="w-6 h-6" />
            Usein kysytyt kysymykset
          </span>
          <span className={`transition-transform duration-200 ${fqaOpen ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>
        {fqaOpen && (
          <div className="space-y-3 mt-4 px-4 pb-2">
            {visibleFaqs.length === 0 ? (
              <div className="bg-neutral-700 border border-neutral-600 rounded-xl px-4 py-3 text-gray-300 italic">
                Ei näytettäviä kysymyksiä
              </div>
            ) : (
              visibleFaqs.map((faq) => (
                <div key={faq._id}>
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(openFaqId === faq._id ? null : faq._id ?? null)}
                    className="w-full flex items-center justify-between gap-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-md px-4 py-3 text-left transition-colors"
                  >
                    <span className="font-semibold">{faq.question}</span>
                    <span className={`transition-transform duration-200 ${openFaqId === faq._id ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>

                  {openFaqId === faq._id && (
                    <div className="mt-3 bg-neutral-700 border border-neutral-600 rounded-xl px-4 py-3 text-gray-200 leading-relaxed">
                      <div>{renderWithLinks(faq.answer)}</div>
                      <p className="mt-3 text-sm text-gray-400">
                        {faq.updatedAt && faq.createdAt && faq.updatedAt !== faq.createdAt
                          ? `Päivitetty: ${new Date(faq.updatedAt).toLocaleDateString('fi-FI')}`
                          : faq.createdAt
                            ? `Lisätty: ${new Date(faq.createdAt).toLocaleDateString('fi-FI')}`
                            : 'ei tiedossa'}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="bg-neutral-900 rounded-lg py-3 mb-4">
        <button
          type="button"
          onClick={() => setInstructionsOpen(!instructionsOpen)}
          className="w-full flex items-center justify-between gap-3 mb-1
          bg-neutral-800 hover:bg-neutral-700 border border-neutral-700
          rounded-md px-4 py-3 text-left transition-colors min-h-[58px]"
        >
          <span className="flex items-center gap-3">
            <Download className="w-6 h-6" />
            Asennusohjeet
          </span>
          <span className={`transition-transform duration-200 ${instructionsOpen ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>
        {instructionsOpen && (
          <div className="flex gap-3 justify-center bg-neutral-700 border border-neutral-600 rounded-lg mx-4 mt-4 p-4">
            <button className="back-button-basic hover:bg-neutral-500" onClick={() => setShowInstall('android')}>
              Android
            </button>
            <button className="button-basic bg-neutral-200 hover:bg-neutral-500" onClick={() => setShowInstall('ios')}>
              iOS
            </button>
          </div>
        )}
      </div>

      {showInstall && (
        <InstallPromptPopup onClose={() => setShowInstall(null)} platform={showInstall} />
      )}

      <div className="bg-neutral-900 rounded-lg py-3 mb-4">
        <button
          type="button"
          onClick={() => setFeedbackOpen(!feedbackOpen)}
          className="w-full flex items-center justify-between gap-3 mb-1
          bg-neutral-800 hover:bg-neutral-700 border border-neutral-700
          rounded-md px-4 py-3 text-left transition-colors min-h-[58px]"
        >
          <span className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6" />
            Anna palautetta
          </span>
          <span className={`transition-transform duration-200 ${feedbackOpen ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>
        {feedbackOpen && (
          <div className="bg-neutral-800 border border-neutral-700 rounded-md mx-4 mt-4 p-6">
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label htmlFor="feedback-title" className="block text-sm font-medium text-gray-300 mb-1">
                  Otsikko:
                </label>
                <input
                  id="feedback-title"
                  value={feedbackTitle}
                  onChange={event => setFeedbackTitle(event.target.value)}
                  className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Esim. 'Musiikkisoitin ei toimi'"
                />
              </div>

              <div>
                <label htmlFor="feedback-category" className="block text-sm font-medium text-gray-300 mb-1">
                  Kategoria:
                </label>
                <select
                  id="feedback-category"
                  value={feedbackCategory}
                  onChange={event => setFeedbackCategory(event.target.value as FeedbackCategory)}
                  className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="bug">{categoryLabel.bug}</option>
                  <option value="feature">{categoryLabel.feature}</option>
                  <option value="other">{categoryLabel.other}</option>
                </select>
              </div>

              <div className="hidden" aria-hidden="true">
                <label htmlFor="feedback-reference-code">Reference code</label>
                <input
                  id="feedback-reference-code"
                  value={feedbackWebsite}
                  onChange={event => setFeedbackWebsite(event.target.value)}
                  autoComplete="new-password"
                  tabIndex={-1}
                />
              </div>

              <div>
                <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-300 mb-1">
                  Palautteesi:
                </label>
                <textarea
                  id="feedback-message"
                  value={feedbackMessage}
                  onChange={event => setFeedbackMessage(event.target.value)}
                  rows={6}
                  className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Kirjoita palaute tähän..."
                />
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={submitFeedback.isPending}
                  className="button-basic disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitFeedback.isPending ? 'Lähetetään...' : 'Lähetä palaute'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {userType === 'teacher' && (
        <div className="bg-neutral-900 rounded-lg py-3 mb-4">
          <button
            type="button"
            onClick={() => setAdminOpen(!adminOpen)}
            className="w-full flex items-center justify-between gap-3 mb-1
            bg-neutral-800 hover:bg-neutral-700 border border-neutral-700
            rounded-md px-4 py-3 text-left transition-colors min-h-[58px]"
          >
            <span className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6" />
              Oppilaiden hallinta
            </span>
            <span className={`transition-transform duration-200 ${adminOpen ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>
          {adminOpen && (
            <div className="mt-4 px-4 pb-2">
              <TeacherSettings />
            </div>
          )}
        </div>
      )}

      {userType === 'student' && <StudentSettings />}

      <div className="bg-neutral-900 rounded-lg py-6">
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

      <p className="text-right text-xs text-gray-500">Versio: {__APP_VERSION__}</p>
      {__BUILD_TIME__ && (
        <p className="text-right text-xs text-gray-500">
          Viimeksi päivitetty:{' '}
          {Number.isNaN(Date.parse(__BUILD_TIME__))
            ? __BUILD_TIME__
            : new Date(__BUILD_TIME__).toLocaleString('fi-FI')}
        </p>
      )}
    </PageContainer>
  )
}
