import { useCallback, useEffect, useState } from 'react'
import { useNotification } from '../hooks/useNotification'
import { adminService } from '../services/admin'
import type { AdminPopupMessage } from '../services/admin'

type AudienceState = {
  teachers: boolean
  students: boolean
}

type VisibilityWindowState = {
  visibleFrom: string
  visibleUntil: string
}

const DEFAULT_AUDIENCE: AudienceState = {
  teachers: true,
  students: true
}

const DEFAULT_VISIBILITY_WINDOW: VisibilityWindowState = {
  visibleFrom: '',
  visibleUntil: ''
}

const formatDate = (value: string): string => {
  if (!value) return ''
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value

  return parsed.toLocaleDateString('fi-FI', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const formatDateTime = (value: string): string => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return parsed.toLocaleString('fi-FI', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

const getVisibilityStatusLabel = (
  message: Pick<AdminPopupMessage, 'visibilityStatus' | 'visibleFrom' | 'visibleUntil'>
): string => {
  switch (message.visibilityStatus) {
    case 'expired':
      return 'Vanhentunut'
    case 'upcoming':
      return 'Tulossa'
    case 'active':
      return 'Voimassa'
    default:
      return !message.visibleFrom && !message.visibleUntil
        ? 'Aina näkyvissä'
        : 'Voimassa'
  }
}

const getVisibilityStatusClass = (
  message: Pick<AdminPopupMessage, 'visibilityStatus'>
): string => {
  switch (message.visibilityStatus) {
    case 'expired':
      return 'bg-red-800 text-red-100'
    case 'upcoming':
      return 'bg-sky-800 text-sky-100'
    case 'active':
    case undefined:
      return 'bg-emerald-800 text-emerald-100'
    default:
      return 'bg-emerald-800 text-emerald-100'
  }
}

const buildVisibilitySummary = (message: Pick<AdminPopupMessage, 'visibleFrom' | 'visibleUntil'>): string => {
  if (!message.visibleFrom && !message.visibleUntil) return 'Aina näkyvissä'

  const from = message.visibleFrom ? formatDate(message.visibleFrom) : '...'
  const until = message.visibleUntil ? formatDate(message.visibleUntil) : '...'
  return `Näkyvyys ${from} - ${until}`
}

const hasInvalidVisibilityWindow = (window: VisibilityWindowState): boolean => {
  return Boolean(window.visibleFrom && window.visibleUntil && window.visibleFrom > window.visibleUntil)
}

export const PopupAdminPage = () => {
  const { showError, showSuccess } = useNotification()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isDraft, setIsDraft] = useState(false)
  const [audience, setAudience] = useState<AudienceState>(DEFAULT_AUDIENCE)
  const [messages, setMessages] = useState<AdminPopupMessage[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editIsDraft, setEditIsDraft] = useState(false)
  const [editAudience, setEditAudience] = useState<AudienceState>(DEFAULT_AUDIENCE)
  const [visibilityWindow, setVisibilityWindow] = useState<VisibilityWindowState>(
    DEFAULT_VISIBILITY_WINDOW
  )
  const [editVisibilityWindow, setEditVisibilityWindow] = useState<VisibilityWindowState>(
    DEFAULT_VISIBILITY_WINDOW
  )

  const resetCreateForm = () => {
    setTitle('')
    setContent('')
    setIsDraft(false)
    setAudience(DEFAULT_AUDIENCE)
    setVisibilityWindow(DEFAULT_VISIBILITY_WINDOW)
  }

  const resetEditForm = () => {
    setEditingId(null)
    setEditTitle('')
    setEditContent('')
    setEditIsDraft(false)
    setEditAudience(DEFAULT_AUDIENCE)
    setEditVisibilityWindow(DEFAULT_VISIBILITY_WINDOW)
  }

  const hasSelectedAudience = (state: AudienceState) =>
    state.teachers || state.students

  const loadMessages = useCallback(async () => {
    setIsLoadingMessages(true)
    try {
      const response = await adminService.getAdminPopupMessages()
      setMessages(response.messages)
    } catch (error: unknown) {
      showError(
        error instanceof Error
          ? error.message
          : 'Pop-upien haku epäonnistui'
      )
    } finally {
      setIsLoadingMessages(false)
    }
  }, [showError])

  useEffect(() => {
    void loadMessages()
  }, [loadMessages])

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()

    if (!trimmedTitle) {
      showError('Kirjoita otsikko ennen lähettämistä')
      return
    }
    if (!trimmedContent) {
      showError('Kirjoita viesti ennen lähettämistä')
      return
    }
    if (!hasSelectedAudience(audience)) {
      showError('Valitse vähintään yksi kohderyhmä')
      return
    }
    if (hasInvalidVisibilityWindow(visibilityWindow)) {
      showError('Aloituspäivä ei voi olla päättymispäivän jälkeen')
      return
    }

    setIsSubmitting(true)
    try {
      await adminService.createPopupMessage({
        title: trimmedTitle,
        content: trimmedContent,
        isDraft,
        visibleToTeachers: audience.teachers,
        visibleToStudents: audience.students,
        visibleFrom: visibilityWindow.visibleFrom || null,
        visibleUntil: visibilityWindow.visibleUntil || null
      })
      showSuccess(isDraft ? 'Luonnos tallennettu' : 'Pop-up lähetetty')
      resetCreateForm()
      await loadMessages()
    } catch (error: unknown) {
      showError(
        error instanceof Error ? error.message : 'Pop-upin lähetys epäonnistui'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const onDeleteAll = async () => {
    const confirmed = window.confirm(
      'Poistetaanko kaikki pop-upit? Tätä ei voi perua.'
    )
    if (!confirmed) {
      return
    }

    setIsDeleting(true)
    try {
      await adminService.deleteAllPopupMessages()
      showSuccess('Kaikki viestit poistettu')
      await loadMessages()
    } catch (error: unknown) {
      showError(
        error instanceof Error ? error.message : 'Poisto epäonnistui'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const startEditing = (message: AdminPopupMessage) => {
    setEditingId(message.id)
    setEditTitle(message.title)
    setEditContent(message.content)
    setEditIsDraft(message.isDraft)
    setEditAudience({
      teachers: message.visibleToTeachers !== false,
      students: message.visibleToStudents !== false
    })
    setEditVisibilityWindow({
      visibleFrom: message.visibleFrom || '',
      visibleUntil: message.visibleUntil || ''
    })
  }

  const onSaveEdit = async (messageId: string) => {
    const trimmedTitle = editTitle.trim()
    const trimmedContent = editContent.trim()

    if (!trimmedTitle) {
      showError('Kirjoita otsikko ennen tallentamista')
      return
    }
    if (!trimmedContent) {
      showError('Kirjoita viesti ennen tallentamista')
      return
    }
    if (!hasSelectedAudience(editAudience)) {
      showError('Valitse vähintään yksi kohderyhmä')
      return
    }
    if (hasInvalidVisibilityWindow(editVisibilityWindow)) {
      showError('Aloituspäivä ei voi olla päättymispäivän jälkeen')
      return
    }

    setProcessingId(messageId)
    try {
      await adminService.updateAdminPopupMessage(messageId, {
        title: trimmedTitle,
        content: trimmedContent,
        isDraft: editIsDraft,
        visibleToTeachers: editAudience.teachers,
        visibleToStudents: editAudience.students,
        visibleFrom: editVisibilityWindow.visibleFrom || null,
        visibleUntil: editVisibilityWindow.visibleUntil || null
      })
      showSuccess(editIsDraft ? 'Luonnos tallennettu' : 'Pop-up päivitetty')
      resetEditForm()
      await loadMessages()
    } catch (error: unknown) {
      showError(
        error instanceof Error ? error.message : 'Pop-upin päivitys epäonnistui'
      )
    } finally {
      setProcessingId(null)
    }
  }

  const onToggleDraft = async (message: AdminPopupMessage) => {
    setProcessingId(message.id)
    try {
      await adminService.updateAdminPopupMessageDraftStatus(
        message.id,
        !message.isDraft
      )
      showSuccess(
        !message.isDraft
          ? 'Pop-up asetettu luonnokseksi'
          : 'Luonnos julkaistu'
      )
      await loadMessages()
    } catch (error: unknown) {
      showError(
        error instanceof Error ? error.message : 'Tilan päivitys epäonnistui'
      )
    } finally {
      setProcessingId(null)
    }
  }

  const onDeleteOne = async (id: string) => {
    const message = messages.find(item => item.id === id)
    const confirmed = window.confirm(
      `Poistetaanko pop-up${message ? ` "${message.title}"` : ''}? Tätä ei voi perua.`
    )
    if (!confirmed) {
      return
    }

    setProcessingId(id)
    try {
      await adminService.deleteAdminPopupMessage(id)
      showSuccess('Pop-up poistettu')
      await loadMessages()
    } catch (error: unknown) {
      showError(
        error instanceof Error ? error.message : 'Pop-upin poisto epäonnistui'
      )
    } finally {
      setProcessingId(null)
    }
  }

  const audienceLabel = (message: AdminPopupMessage) => {
    const parts: string[] = []
    if (message.visibleToTeachers !== false) parts.push('Opettajat')
    if (message.visibleToStudents !== false) parts.push('Oppilaat')
    return parts.join(', ')
  }

  return (
    <div className="space-y-6 p-6 pb-24">
      <h2>Pop-up</h2>

      <div className="bg-neutral-900 rounded-lg p-6">
        <h3 className="mb-4">Lähetä pop-up</h3>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="popup-title"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Otsikko:
            </label>
            <input
              id="popup-title"
              value={title}
              onChange={event => setTitle(event.target.value)}
              className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Esim. 'Huoltotiedote'"
            />
          </div>

          <div>
            <label
              htmlFor="popup-content"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Viesti:
            </label>
            <textarea
              id="popup-content"
              value={content}
              onChange={event => setContent(event.target.value)}
              rows={6}
              className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Kirjoita viesti tähän..."
            />
          </div>

          <div className="space-y-2">
            <p className="block text-sm font-medium text-gray-300">Näkyvyys:</p>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={audience.teachers}
                onChange={event =>
                  setAudience(current => ({
                    ...current,
                    teachers: event.target.checked
                  }))
                }
              />
              Opettajat
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={audience.students}
                onChange={event =>
                  setAudience(current => ({
                    ...current,
                    students: event.target.checked
                  }))
                }
              />
              Oppilaat
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={isDraft}
              onChange={event => setIsDraft(event.target.checked)}
            />
            Luonnos
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="popup-visible-from"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Näkyy alkaen:
              </label>
              <input
                id="popup-visible-from"
                type="date"
                value={visibilityWindow.visibleFrom}
                onChange={event =>
                  setVisibilityWindow(current => ({
                    ...current,
                    visibleFrom: event.target.value
                  }))
                }
                className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label
                htmlFor="popup-visible-until"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Näkyy viimeisen kerran:
              </label>
              <input
                id="popup-visible-until"
                type="date"
                value={visibilityWindow.visibleUntil}
                onChange={event =>
                  setVisibilityWindow(current => ({
                    ...current,
                    visibleUntil: event.target.value
                  }))
                }
                className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="button-basic disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Tallennetaan...' : isDraft ? 'Tallenna luonnos' : 'Lähetä'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-neutral-900 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3>Nykyiset pop-upit</h3>
          <button
            type="button"
            onClick={() => void loadMessages()}
            className="button-basic"
          >
            Päivitä
          </button>
        </div>

        {isLoadingMessages ? (
          <p className="text-gray-300">Ladataan pop-upeja...</p>
        ) : messages.length === 0 ? (
          <p className="text-gray-300">Ei pop-up-viestejä.</p>
        ) : (
          <div className="space-y-3">
            {messages.map(message => {
              const isProcessingThis = processingId === message.id
              const isEditingThis = editingId === message.id
              return (
                <div
                  key={message.id}
                  className="rounded-md border border-neutral-700 bg-neutral-800 p-4 space-y-2"
                >
                  {isEditingThis ? (
                    <div className="space-y-3">
                      <div>
                        <label
                          htmlFor={`edit-popup-title-${message.id}`}
                          className="block text-sm font-medium text-gray-300 mb-1"
                        >
                          Otsikko:
                        </label>
                        <input
                          id={`edit-popup-title-${message.id}`}
                          value={editTitle}
                          onChange={event => setEditTitle(event.target.value)}
                          className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`edit-popup-content-${message.id}`}
                          className="block text-sm font-medium text-gray-300 mb-1"
                        >
                          Viesti:
                        </label>
                        <textarea
                          id={`edit-popup-content-${message.id}`}
                          value={editContent}
                          onChange={event => setEditContent(event.target.value)}
                          rows={6}
                          className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-2">
                        <p className="block text-sm font-medium text-gray-300">Näkyvyys:</p>
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={editAudience.teachers}
                            onChange={event =>
                              setEditAudience(current => ({
                                ...current,
                                teachers: event.target.checked
                              }))
                            }
                          />
                          Opettajat
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={editAudience.students}
                            onChange={event =>
                              setEditAudience(current => ({
                                ...current,
                                students: event.target.checked
                              }))
                            }
                          />
                          Oppilaat
                        </label>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label
                            htmlFor={`edit-popup-visible-from-${message.id}`}
                            className="block text-sm font-medium text-gray-300 mb-1"
                          >
                            Näkyy alkaen:
                          </label>
                          <input
                            id={`edit-popup-visible-from-${message.id}`}
                            type="date"
                            value={editVisibilityWindow.visibleFrom}
                            onChange={event =>
                              setEditVisibilityWindow(current => ({
                                ...current,
                                visibleFrom: event.target.value
                              }))
                            }
                            className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`edit-popup-visible-until-${message.id}`}
                            className="block text-sm font-medium text-gray-300 mb-1"
                          >
                            Näkyy viimeisen kerran:
                          </label>
                          <input
                            id={`edit-popup-visible-until-${message.id}`}
                            type="date"
                            value={editVisibilityWindow.visibleUntil}
                            onChange={event =>
                              setEditVisibilityWindow(current => ({
                                ...current,
                                visibleUntil: event.target.value
                              }))
                            }
                            className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={editIsDraft}
                          onChange={event => setEditIsDraft(event.target.checked)}
                        />
                        Luonnos
                      </label>

                      <p className="text-xs text-gray-400">
                        {editIsDraft ? 'Luonnos' : 'Julkinen'} · Näkyy:{' '}
                        {editAudience.teachers ? 'Opettajat' : ''}
                        {editAudience.teachers && editAudience.students ? ', ' : ''}
                        {editAudience.students ? 'Oppilaat' : ''}
                        {' · '}
                        {buildVisibilitySummary(editVisibilityWindow)}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="button-basic disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isProcessingThis}
                          onClick={() => void onSaveEdit(message.id)}
                        >
                          Tallenna
                        </button>
                        <button
                          type="button"
                          className="button-basic disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isProcessingThis}
                          onClick={resetEditForm}
                        >
                          Peruuta
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="text-lg font-semibold break-words">{message.title}</h4>
                        <div className="flex flex-wrap gap-2 justify-end">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              message.isDraft
                                ? 'bg-amber-800 text-amber-100'
                                : 'bg-emerald-800 text-emerald-100'
                            }`}
                          >
                            {message.isDraft ? 'Luonnos' : 'Julkinen'}
                          </span>
                          <span className="text-xs px-2 py-1 rounded bg-neutral-700 text-neutral-100">
                            {audienceLabel(message)}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${getVisibilityStatusClass(
                              message
                            )}`}
                          >
                            {getVisibilityStatusLabel(message)}
                          </span>
                        </div>
                      </div>

                      <p className="whitespace-pre-wrap text-gray-200 break-words">{message.content}</p>
                      <p className="text-xs text-gray-400">
                        {message.isDraft ? 'Luotu' : 'Julkaistu'}:{' '}
                        {formatDateTime(message.postedAt)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {buildVisibilitySummary(message)}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="button-basic disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isProcessingThis}
                          onClick={() => startEditing(message)}
                        >
                          Muokkaa
                        </button>
                        <button
                          type="button"
                          className="button-basic disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isProcessingThis}
                          onClick={() => void onToggleDraft(message)}
                        >
                          {message.isDraft ? 'Julkaise' : 'Aseta luonnokseksi'}
                        </button>
                        <button
                          type="button"
                          className="button-basic disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isProcessingThis}
                          onClick={() => void onDeleteOne(message.id)}
                        >
                          Poista
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onDeleteAll}
          disabled={isDeleting}
          className="button-basic disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? 'Poistetaan...' : 'Poista kaikki viestit'}
        </button>
      </div>
    </div>
  )
}
