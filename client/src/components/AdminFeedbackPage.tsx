import { useAdminFeedbacks, useDeleteAdminFeedback } from '../hooks/useAdmin'
import { useUpdateAdminFeedbackReadStatus } from '../hooks/useAdmin'
import type { AdminFeedbackItem } from '../services/admin'
import { categoryLabel } from '../utils/feedbackLabels'
import { MessageSquare, Trash2 } from 'lucide-react'


const userTypeLabel: Record<AdminFeedbackItem['userType'], string> = {
  teacher: 'Opettaja',
  student: 'Oppilas'
}

export const AdminFeedbackPage = () => {
  const { data, isLoading, error } = useAdminFeedbacks()
  const updateReadStatus = useUpdateAdminFeedbackReadStatus()
  const deleteFeedback = useDeleteAdminFeedback()
  const feedbacks = data?.feedbacks ?? []

  return (
    <div className="space-y-4 p-5 pb-24">
      <h1 className="flex items-center gap-3">
        <MessageSquare className="w-8 h-8" />
        Palautteet
      </h1>

      <div className="bg-neutral-900 rounded-lg p-6">
        {isLoading ? (
          <p className="text-gray-400">Ladataan palautteita...</p>
        ) : error ? (
          <p className="text-rose-300">Palautteen lataus epäonnistui</p>
        ) : feedbacks.length === 0 ? (
          <p className="text-gray-400">Ei palautteita.</p>
        ) : (
          <ul className="space-y-4">
            {feedbacks.map(item => (
              <li key={item.id} className="bg-neutral-800 rounded-lg p-4 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{item.title}</span>
                  <span className="text-xs text-gray-400">
                  {new Date(item.createdAt).toLocaleString('fi-FI', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>

                <button
                  type="button"
                  disabled={deleteFeedback.isPending}
                  className="text-neutral-400 hover:text-red-400 disabled:opacity-50 transition-colors p-1"
                  onClick={() => {
                    if (window.confirm('Haluatko varmasti poistaa tämän palautteen?')) {
                      deleteFeedback.mutate(item.id)
                    }
                  }}
                  aria-label="Poista palaute"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={item.isRead === true}
                  onChange={event => {
                    updateReadStatus.mutate({ id: item.id, isRead: event.target.checked })
                  }}
                />
                Luettu
              </label>
              <div className="text-sm text-gray-300 flex flex-wrap gap-x-2 gap-y-0.5">
                <span>{categoryLabel[item.category]}</span>
                <span>·</span>
                <span>{userTypeLabel[item.userType]}</span>
                <span>·</span>
                <span>{item.senderName}</span>
                {item.senderEmail && (
                  <>
                    <span>·</span>
                    <span className="break-all">{item.senderEmail}</span>
                  </>
                )}
              </div>
              <p className="text-sm mt-2 whitespace-pre-wrap">{item.message}</p>
            </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
