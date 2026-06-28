import { useCallback, useEffect, useState } from 'react'
import { useNotification } from '../hooks/useNotification'
import { adminService } from '../services/admin'
import { Bell, Trash2, X } from 'lucide-react'
import type { AdminPopupImagePayload, AdminPopupMessage } from '../services/admin'
import { notifyAdminPopupsUpdated } from '../utils/adminPopupEvents'

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

const MAX_POPUP_IMAGES = 6
const IMAGE_EXTENSION_PATTERN = /\.(avif|gif|heic|heif|jpe?g|png|webp|svg)$/i

const isLikelyImageFile = (file: File): boolean =>
  file.type.startsWith('image/') || IMAGE_EXTENSION_PATTERN.test(file.name)

const SelectedImagePreview = ({
  file,
  onRemove
}: {
  file: File
  onRemove: () => void
}) => {
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  return (
    <div className="relative overflow-hidden rounded-md border border-neutral-700 bg-neutral-900">
      {previewUrl && (
        <img
          src={previewUrl}
          alt={file.name}
          className="h-24 w-full object-cover"
        />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1 text-xs text-white">
        <span className="block truncate">{file.name}</span>
      </div>
      <button
        type="button"
        className="absolute right-1 top-1 rounded bg-black/70 p-1 text-white hover:bg-black"
        onClick={onRemove}
        aria-label={`Poista kuva ${file.name}`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export const AdminPopupPage = () => {
  const { showError, showSuccess } = useNotification()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imageInputKey, setImageInputKey] = useState(0)
  const [isDraft, setIsDraft] = useState(true)
  const [audience, setAudience] = useState<AudienceState>(DEFAULT_AUDIENCE)
  const [messages, setMessages] = useState<AdminPopupMessage[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editExistingImages, setEditExistingImages] = useState<AdminPopupImagePayload[]>([])
  const [editImageFiles, setEditImageFiles] = useState<File[]>([])
  const [editImageInputKey, setEditImageInputKey] = useState(0)
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
    setImageFiles([])
    setImageInputKey(current => current + 1)
    setIsDraft(true)
    setAudience(DEFAULT_AUDIENCE)
    setVisibilityWindow(DEFAULT_VISIBILITY_WINDOW)
  }

  const resetEditForm = () => {
    setEditingId(null)
    setEditTitle('')
    setEditContent('')
    setEditExistingImages([])
    setEditImageFiles([])
    setEditImageInputKey(current => current + 1)
    setEditIsDraft(false)
    setEditAudience(DEFAULT_AUDIENCE)
    setEditVisibilityWindow(DEFAULT_VISIBILITY_WINDOW)
  }

  const hasSelectedAudience = (state: AudienceState) =>
    state.teachers || state.students

  const addImageFiles = (
    files: FileList | null | undefined,
    setter: React.Dispatch<React.SetStateAction<File[]>>,
    existingCount = 0
  ) => {
    const incoming = Array.from(files ?? [])
    const selected = incoming.filter(isLikelyImageFile)
    if (selected.length === 0) return
    if (selected.length < incoming.length) {
      showError('Osa tiedostoista ohitettiin, koska ne eivÃ¤t nÃ¤ytÃ¤ kuvilta')
    }

    setter(current => {
      const availableSlots = Math.max(0, MAX_POPUP_IMAGES - existingCount - current.length)
      if (selected.length > availableSlots) {
        showError(`Voit lisÃ¤tÃ¤ enintÃ¤Ã¤n ${MAX_POPUP_IMAGES} kuvaa`)
      }
      return [...current, ...selected.slice(0, availableSlots)]
    })
  }

  const removeImageFile = (
    index: number,
    setter: React.Dispatch<React.SetStateAction<File[]>>
  ) => {
    setter(current => current.filter((_, currentIndex) => currentIndex !== index))
  }

  const loadMessages = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setIsLoadingMessages(true)
    }
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
      if (!options?.silent) {
        setIsLoadingMessages(false)
      }
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
        visibleUntil: visibilityWindow.visibleUntil || null,
        images: imageFiles
      })
      showSuccess(isDraft ? 'Luonnos tallennettu' : 'Pop-up julkaistu')
      resetCreateForm()
      await loadMessages({ silent: true })
      notifyAdminPopupsUpdated()
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
      await loadMessages({ silent: true })
      notifyAdminPopupsUpdated()
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
    setEditExistingImages(message.images ?? [])
    setEditImageFiles([])
    setEditImageInputKey(current => current + 1)
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
        visibleUntil: editVisibilityWindow.visibleUntil || null,
        existingImages: editExistingImages,
        images: editImageFiles
      })
      showSuccess(editIsDraft ? 'Luonnos tallennettu' : 'Pop-up julkaistu')
      resetEditForm()
      await loadMessages({ silent: true })
      notifyAdminPopupsUpdated()
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
      await loadMessages({ silent: true })
      notifyAdminPopupsUpdated()
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
      await loadMessages({ silent: true })
      notifyAdminPopupsUpdated()
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
    <div className="admin-page">
      <h1 className="admin-page-title">
        <Bell className="admin-page-title-icon" />
        Pop-up
      </h1>

      <div className="admin-card">
        <h3 className="admin-card-title">Lähetä pop-up</h3>

        <form onSubmit={onSubmit} className="-mx-4 space-y-4 sm:-mx-6">
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

          <div>
            <label
              htmlFor="popup-images"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Kuvat:
            </label>
            <input
              key={imageInputKey}
              id="popup-images"
              type="file"
              accept="image/*"
              multiple
              onChange={event => {
                addImageFiles(event.target.files, setImageFiles)
                event.target.value = ''
              }}
              className="block w-full rounded-md border border-neutral-600 bg-neutral-700 px-3 py-2 text-sm text-gray-100 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-600 file:px-3 file:py-1.5 file:text-gray-100 hover:file:bg-neutral-500 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
            {imageFiles.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {imageFiles.map((file, index) => (
                  <SelectedImagePreview
                    key={`${file.name}-${file.lastModified}-${index}`}
                    file={file}
                    onRemove={() => removeImageFile(index, setImageFiles)}
                  />
                ))}
              </div>
            )}
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

          <div className="flex items-center gap-2 text-sm text-gray-200">
            <span
              className={`text-xs px-2 py-1 rounded ${
                isDraft
                  ? 'bg-amber-800 text-amber-100'
                  : 'bg-emerald-800 text-emerald-100'
              }`}
            >
              Julkaistu
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={!isDraft}
              aria-label={`Aseta pop-up ${isDraft ? 'julkaistuksi' : 'luonnokseksi'}`}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isDraft ? 'bg-amber-600' : 'bg-emerald-600'
              }`}
              onClick={() => setIsDraft(current => !current)}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  isDraft ? 'translate-x-1' : 'translate-x-5'
                }`}
              />
            </button>
          </div>

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
              data-testid="popup-create-submit"
              disabled={isSubmitting}
              className="button-basic disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Tallennetaan...' : isDraft ? 'Tallenna luonnos' : 'Julkaise'}
            </button>
          </div>
        </form>
      </div>

      <div className="admin-card space-y-4">
        <div className="flex items-center gap-4">
          <h3 className="admin-card-title mb-0">Nykyiset pop-upit</h3>
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
                  data-testid="popup-message-card"
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

                      <div>
                        <label
                          htmlFor={`edit-popup-images-${message.id}`}
                          className="block text-sm font-medium text-gray-300 mb-1"
                        >
                          Kuvat:
                        </label>
                        <input
                          key={editImageInputKey}
                          id={`edit-popup-images-${message.id}`}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={event => {
                            addImageFiles(
                              event.target.files,
                              setEditImageFiles,
                              editExistingImages.length
                            )
                            event.target.value = ''
                          }}
                          className="block w-full rounded-md border border-neutral-600 bg-neutral-700 px-3 py-2 text-sm text-gray-100 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-600 file:px-3 file:py-1.5 file:text-gray-100 hover:file:bg-neutral-500 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        />
                        {(editExistingImages.length > 0 || editImageFiles.length > 0) && (
                          <div className="mt-3 space-y-3">
                            {editExistingImages.length > 0 && (
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {editExistingImages.map((image, index) => (
                                  <div
                                    key={`${image.name}-${index}`}
                                    className="relative overflow-hidden rounded-md border border-neutral-700 bg-neutral-900"
                                  >
                                    <img
                                      src={image.data}
                                      alt={image.name}
                                      className="h-24 w-full object-cover"
                                    />
                                    <button
                                      type="button"
                                      className="absolute right-1 top-1 rounded bg-black/70 p-1 text-white hover:bg-black"
                                      onClick={() =>
                                        setEditExistingImages(current =>
                                          current.filter((_, currentIndex) => currentIndex !== index)
                                        )
                                      }
                                      aria-label={`Poista kuva ${image.name}`}
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            {editImageFiles.length > 0 && (
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {editImageFiles.map((file, index) => (
                                  <SelectedImagePreview
                                    key={`${file.name}-${file.lastModified}-${index}`}
                                    file={file}
                                    onRemove={() => removeImageFile(index, setEditImageFiles)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
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

                      <div className="flex flex-col gap-3 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-200">Tila</p>
                          <p className="text-xs text-gray-400">OFF = Luonnos, ON = Julkaistu</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-200">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              editIsDraft
                                ? 'bg-amber-800 text-amber-100'
                                : 'bg-emerald-800 text-emerald-100'
                            }`}
                          >
                            Julkaistu
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={!editIsDraft}
                            aria-label={`Aseta pop-up ${editIsDraft ? 'julkaistuksi' : 'luonnokseksi'}`}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              editIsDraft ? 'bg-amber-600' : 'bg-emerald-600'
                            }`}
                            onClick={() => setEditIsDraft(current => !current)}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                editIsDraft ? 'translate-x-1' : 'translate-x-5'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-gray-400">
                        {editIsDraft ? 'Luonnos' : 'Julkaistu'} · Näkyy:{' '}
                        {editAudience.teachers ? 'Opettajat' : ''}
                        {editAudience.teachers && editAudience.students ? ', ' : ''}
                        {editAudience.students ? 'Oppilaat' : ''}
                        {' · '}
                        {buildVisibilitySummary(editVisibilityWindow)}
                      </p>

                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
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
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <h4 className="break-words text-lg font-semibold">{message.title}</h4>
                        <div className="flex flex-wrap gap-2 sm:justify-end">
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
                      {message.images && message.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {message.images.slice(0, 3).map((image, index) => (
                            <img
                              key={`${image.name}-${index}`}
                              src={image.data}
                              alt={image.name}
                              className="h-24 w-full rounded-md border border-neutral-700 object-cover"
                            />
                          ))}
                          {message.images.length > 3 && (
                            <div className="flex h-24 items-center justify-center rounded-md border border-neutral-700 bg-neutral-900 text-sm text-gray-300">
                              +{message.images.length - 3} kuvaa
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-400">
                        {message.isDraft ? 'Luotu' : 'Julkaistu'}:{' '}
                        {formatDateTime(message.postedAt)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {buildVisibilitySummary(message)}
                      </p>

                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
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
                            className="button-basic inline-flex h-10 w-10 min-w-10 items-center justify-center rounded-full !px-0 !py-0 text-black disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isProcessingThis}
                            onClick={() => void onDeleteOne(message.id)}
                            aria-label="Poista pop-up"
                            title="Poista pop-up"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-200 sm:justify-end">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              message.isDraft
                                ? 'bg-amber-800 text-amber-100'
                                : 'bg-emerald-800 text-emerald-100'
                            }`}
                          >
                            Julkaistu
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={!message.isDraft}
                            aria-label={`Aseta pop-up ${message.isDraft ? 'julkaistuksi' : 'luonnokseksi'}`}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              message.isDraft ? 'bg-amber-600' : 'bg-emerald-600'
                            }`}
                            disabled={isProcessingThis}
                            onClick={() => void onToggleDraft(message)}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                message.isDraft ? 'translate-x-1' : 'translate-x-5'
                              }`}
                            />
                          </button>
                        </div>
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
