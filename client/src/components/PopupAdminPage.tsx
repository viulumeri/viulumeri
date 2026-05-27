import { useState } from 'react'
import { useNotification } from '../hooks/useNotification'
import { adminService } from '../services/admin'

export const PopupAdminPage = () => {
  const { showError, showSuccess } = useNotification()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
        content: trimmedContent
      })
      showSuccess('Pop-up lähetetty')
      setTitle('')
      setContent('')
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
    } catch (error: unknown) {
      showError(
        error instanceof Error ? error.message : 'Poisto epäonnistui'
      )
    } finally {
      setIsDeleting(false)
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

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="button-basic disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Lähetetään...' : 'Lähetä'}
            </button>
          </div>
        </form>
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
