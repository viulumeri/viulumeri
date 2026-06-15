import { useState } from 'react'
import { useSubmitFeedback } from '../hooks/useFeedback'
import type { FeedbackCategory } from '../../../shared/types'
import { useNotification } from '../hooks/useNotification'
import { categoryLabel } from '../utils/feedbackLabels'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
export const FeedbackPage = () => {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState<FeedbackCategory>('bug')
  const [website, setWebsite] = useState('')
  const { showError, showSuccess } = useNotification()
  const navigate = useNavigate()

  const submitFeedback = useSubmitFeedback({
    onSuccess: () => {
      showSuccess('Kiitos palautteesta!')
      setTitle('')
      setMessage('')
      setCategory('bug')
      setWebsite('')
    },
    onError: error => {
      showError(`Palautteen lähetys epäonnistui: ${error.message}`)
    }
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      showError('Kirjoita otsikko ennen lähettämistä')
      return
    }
    if (trimmedTitle.length > 200) {
      showError('Otsikko voi olla enintään 200 merkkiä')
      return
    }

    const trimmedMessage = message.trim()
    if (!trimmedMessage) {
      showError('Kirjoita palaute ennen lähettämistä')
      return
    }
    if (trimmedMessage.length < 5) {
      showError('Kirjoita vähintään 5 merkkiä palautteeseen')
      return
    }

    // Lightweight spam prevention:
    // - Honeypot field (website) should stay empty
    if (website.trim()) {
      showError('Lähetys epäonnistui')
      return
    }

    submitFeedback.mutate({
      title: trimmedTitle,
      category,
      message: trimmedMessage,
      website
    })
  }

return (
    <div className="space-y-6 p-6 pb-24">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-1 hover:bg-neutral-800 rounded-full transition-colors"
          aria-label="Palaa takaisin"
        >
          <ArrowLeft className="w-8 h-8 text-white" />
        </button>
        <h2 className="text-2xl font-bold m-0">Palaute</h2>
      </div>

      <div className="bg-neutral-900 rounded-lg p-6">
        <h3 className="mb-4">Lähetä palaute</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="feedback-title"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Otsikko:
            </label>
            <input
              id="feedback-title"
              value={title}
              onChange={event => setTitle(event.target.value)}
              className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Esim. 'Musiikkisoitin ei toimi'"
            />
          </div>

          <div>
            <label
              htmlFor="feedback-category"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Kategoria:
            </label>
            <select
              id="feedback-category"
              value={category}
              onChange={event => setCategory(event.target.value as FeedbackCategory)}
              className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="bug">{categoryLabel.bug}</option>
              <option value="feature">{categoryLabel.feature}</option>
              <option value="other">{categoryLabel.other}</option>
            </select>
          </div>

          {/* Honeypot spam trap*/}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="feedback-reference-code">Reference code</label>
            <input
              id="feedback-reference-code"
              value={website}
              onChange={event => setWebsite(event.target.value)}
              autoComplete="new-password"
              tabIndex={-1}
            />
          </div>

          <div>
            <label
              htmlFor="feedback-message"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Palautteesi:
            </label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={event => setMessage(event.target.value)}
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
    </div>
  )
}
