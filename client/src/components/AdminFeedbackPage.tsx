import { useAdminFeedbacks } from '../hooks/useAdmin'
import type { AdminFeedbackItem } from '../services/admin'
import { categoryLabel } from '../utils/feedbackLabels'


const userTypeLabel: Record<AdminFeedbackItem['userType'], string> = {
  teacher: 'Opettaja',
  student: 'Oppilas'
}

export const AdminFeedbackPage = () => {
  const { data, isLoading, error } = useAdminFeedbacks()
  const feedbacks = data?.feedbacks ?? []

  if (isLoading) return <div>Ladataan palautteita...</div>
  if (error) return <div className="error">Palautteen lataus epäonnistui</div>

  return (
    <div className="space-y-6 p-6 pb-24">
      <div className="bg-neutral-900 rounded-lg p-6">
        <h2 className="mb-4">Palautteet</h2>
        {feedbacks.length === 0 ? (
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
              </div>
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
