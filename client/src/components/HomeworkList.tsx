import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { SongListItem, HomeworkListResponse } from '../../../shared/types'
import { useSongsList } from '../hooks/useSongs'
import { usePracticeOnce } from '../hooks/useHomework'
import type { UseQueryResult } from '@tanstack/react-query'

type Props = {
  useHomeworkQuery: () => UseQueryResult<HomeworkListResponse>
  showPracticeCount?: boolean
  actions?: 'student' | 'teacher' | 'none'
}

export const HomeworkList = ({
  useHomeworkQuery,
  showPracticeCount = true,
  actions = 'none'
}: Props) => {
  const { data: songsData } = useSongsList()
  const { data: homeworkData, isLoading, isError, refetch } = useHomeworkQuery()
  const location = useLocation()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const allSongs: SongListItem[] | undefined = songsData

  const practice = usePracticeOnce({
    onSuccess: () => {
      setPendingId(null)
      refetch()
    },
    onError: () => {
      setPendingId(null)
      alert('Harjoituskerran tallennus epäonnistui')
    }
  })

  const titleFor = (id: string) => allSongs?.find(s => s.id === id)?.title ?? id

  if (isLoading) return <div>Ladataan tehtäviä...</div>
  if (isError) return <div>Virhe ladattaessa tehtäviä</div>

  const items = homeworkData?.homework ?? []
  console.log('HomeworkList items:', items)

  if (!items.length) return <div>Ei vielä kotitehtäviä</div>

  return (
    <ul>
      {items.map(homework => {
        const isBusy = pendingId === homework.id
        return (
          <li key={homework.id}>
            <div>
              <strong>Pvm:</strong>{' '}
              {new Date(homework.createdAt).toLocaleDateString()}
            </div>

            {homework.songs.length > 0 && (
              <div>
                <strong>Kappaleet:</strong>{' '}
                {homework.songs.map((id, i) => (
                  <span key={id}>
                    <Link
                      to={`/player/${id}`}
                      state={{ from: location.pathname }}
                    >
                      {titleFor(id)}
                    </Link>
                    {i < homework.songs.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            )}

            {homework.comment && (
              <div>
                <strong>Opettajan kommentti:</strong> {homework.comment}
              </div>
            )}

            {showPracticeCount && (
              <div>
                <strong>Harjoituskerrat:</strong> {homework.practiceCount}
              </div>
            )}

            {actions === 'student' && (
              <button
                onClick={() => {
                  if (pendingId) return
                  setPendingId(homework.id)
                  practice.mutate(homework.id)
                }}
                disabled={isBusy}
                aria-busy={isBusy}
              >
                {isBusy ? 'Tallennetaan…' : 'Harjoittelin'}
              </button>
            )}

            {actions === 'teacher' && <button>Muokkaa</button>}
          </li>
        )
      })}
    </ul>
  )
}
