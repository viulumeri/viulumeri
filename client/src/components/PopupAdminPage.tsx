import { useEffect, useState } from 'react'
import { useNotification } from '../hooks/useNotification'
import { adminService } from '../services/admin'
import type { AdminPopupMessage } from '../services/admin'

export const PopupAdminPage = () => {
  const { showError, showSuccess } = useNotification()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isDraft, setIsDraft] = useState(false)
  const [messages, setMessages] = useState<AdminPopupMessage[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const loadMessages = async () => {
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
  }

  useEffect(() => {
    void loadMessages()
  }, [])

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

    setIsSubmitting(true)
    try {
      await adminService.createPopupMessage({
        title: trimmedTitle,
        content: trimmedContent,
        isDraft
      })
      showSuccess(isDraft ? 'Luonnos tallennettu' : 'Pop-up lähetetty')
      setTitle('')
      setContent('')
      setIsDraft(false)
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

          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={isDraft}
              onChange={event => setIsDraft(event.target.checked)}
            />
            Luonnos
          </label>

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
              return (
                <div
                  key={message.id}
                  className="rounded-md border border-neutral-700 bg-neutral-800 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="text-lg font-semibold break-words">{message.title}</h4>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        message.isDraft
                          ? 'bg-amber-800 text-amber-100'
                          : 'bg-emerald-800 text-emerald-100'
                      }`}
                    >
                      {message.isDraft ? 'Luonnos' : 'Julkinen'}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap text-gray-200 break-words">{message.content}</p>
                  <p className="text-xs text-gray-400">
                    Julkaistu: {new Date(message.postedAt).toLocaleString()}
                  </p>

                  <div className="flex flex-wrap gap-2">
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
