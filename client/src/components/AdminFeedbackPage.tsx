import { useEffect, useMemo, useState } from 'react'
import { useAdminFeedbacks, useDeleteAdminFeedback } from '../hooks/useAdmin'
import { useUpdateAdminFeedbackReadStatus } from '../hooks/useAdmin'
import type { AdminFeedbackItem } from '../services/admin'
import { categoryLabel } from '../utils/feedbackLabels'
import { ChevronDown, ChevronLeft, ChevronRight, MessageSquare, Trash2 } from 'lucide-react'

const RESULTS_PER_PAGE = 5

const userTypeLabel: Record<AdminFeedbackItem['userType'], string> = {
  teacher: 'Opettaja',
  student: 'Oppilas'
}

export const AdminFeedbackPage = () => {
  const { data, isLoading, error } = useAdminFeedbacks()
  const updateReadStatus = useUpdateAdminFeedbackReadStatus()
  const deleteFeedback = useDeleteAdminFeedback()
  const [page, setPage] = useState(0)
  const [openFeedbackIds, setOpenFeedbackIds] = useState<Set<string>>(() => new Set())
  const feedbacks = data?.feedbacks ?? []
  const totalPages = Math.max(Math.ceil(feedbacks.length / RESULTS_PER_PAGE), 1)
  const paginatedFeedbacks = useMemo(
    () => feedbacks.slice(page * RESULTS_PER_PAGE, (page + 1) * RESULTS_PER_PAGE),
    [feedbacks, page]
  )

  useEffect(() => {
    setPage(current => Math.min(current, totalPages - 1))
  }, [totalPages])

  const toggleFeedback = (id: string) => {
    setOpenFeedbackIds(current => {
      const next = new Set(current)

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
  }

  const closeFeedback = (id: string) => {
    setOpenFeedbackIds(current => {
      const next = new Set(current)
      next.delete(id)
      return next
    })
  }

  return (
    <div className="space-y-4 p-5 pb-24">
      <h1 className="flex items-center gap-3">
        <MessageSquare className="w-8 h-8" />
        Palautteet
      </h1>

      <div className="overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900">
        {isLoading ? (
          <p className="px-4 py-5 text-sm text-gray-400 sm:px-6">Ladataan palautteita...</p>
        ) : error ? (
          <p className="px-4 py-5 text-sm text-rose-300 sm:px-6">Palautteen lataus epäonnistui</p>
        ) : feedbacks.length === 0 ? (
          <p className="px-4 py-5 text-sm text-gray-400 sm:px-6">Ei palautteita.</p>
        ) : (
          <ul className="space-y-3 p-3 sm:space-y-4 sm:p-6">
            {paginatedFeedbacks.map(item => {
              const isOpen = openFeedbackIds.has(item.id)

              return (
                <li key={item.id} className="overflow-hidden rounded-lg bg-neutral-800">
                  <button
                    type="button"
                    onClick={() => toggleFeedback(item.id)}
                    className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-700 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center"
                    aria-expanded={isOpen}
                  >
                    <span className="min-w-0 break-words font-semibold text-neutral-100">
                      {item.title}
                    </span>
                    <span className="whitespace-nowrap text-xs text-gray-400 sm:justify-self-end">
                      {new Date(item.createdAt).toLocaleString('fi-FI', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </span>
                    <span
                      className={`w-fit rounded px-2 py-1 text-xs font-medium ${
                        item.isRead
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {item.isRead ? 'Luettu' : 'Lukematta'}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 justify-self-end text-neutral-300 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>

                  {isOpen && (
                    <div className="space-y-3 border-t border-neutral-700 px-4 py-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-gray-300">
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

                        <button
                          type="button"
                          disabled={deleteFeedback.isPending}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-700 bg-neutral-900 text-neutral-400 transition-colors hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => {
                            if (window.confirm('Haluatko varmasti poistaa tämän palautteen?')) {
                              closeFeedback(item.id)
                              deleteFeedback.mutate(item.id)
                            }
                          }}
                          aria-label="Poista palaute"
                          title="Poista palaute"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-sm text-gray-400">
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

                      <p className="whitespace-pre-wrap rounded bg-black/10 p-2.5 text-sm text-gray-200">
                        {item.message}
                      </p>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-neutral-700 bg-neutral-900 px-3 py-2">
          <button
            type="button"
            onClick={() => setPage(current => Math.max(current - 1, 0))}
            disabled={page === 0}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 text-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Edellinen sivu"
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <span className="text-sm text-neutral-300">
            {feedbacks.length > 0 ? page + 1 : 0} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage(current => Math.min(current + 1, totalPages - 1))}
            disabled={page >= totalPages - 1}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 text-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Seuraava sivu"
          >
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  )
}
