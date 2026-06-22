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
    <div className="admin-page">
      <h1 className="admin-page-title">
        <MessageSquare className="admin-page-title-icon" />
        Palautteet
      </h1>

      <div className="admin-card">
        {isLoading ? (
          <p className="text-gray-400">Ladataan palautteita...</p>
        ) : error ? (
          <p className="text-rose-300">Palautteen lataus epäonnistui</p>
        ) : feedbacks.length === 0 ? (
          <p className="text-gray-400">Ei palautteita.</p>
        ) : (
          <ul className="space-y-4">
            {feedbacks.map(item => (
              <li key={item.id} className="space-y-2 rounded-lg bg-neutral-800 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="break-words font-semibold">{item.title}</span>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="text-xs text-gray-400">
                      {new Date(item.createdAt).toLocaleString('fi-FI', { 
                        dateStyle: 'short', 
                        timeStyle: 'short' 
                      })}
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
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    className="rounded border-neutral-600 bg-neutral-700 text-blue-500 focus:ring-blue-500"
                    checked={item.isRead === true}
                    onChange={event => {
                      updateReadStatus.mutate({ id: item.id, isRead: event.target.checked })
                    }}
                  />
                  <span>Luettu</span>
                </label>

                <div className="text-sm text-gray-400 flex flex-wrap gap-x-2 gap-y-0.5 pt-1">
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

                <p className="text-sm mt-2 whitespace-pre-wrap text-gray-200 bg-black/10 p-2.5 rounded">
                  {item.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
