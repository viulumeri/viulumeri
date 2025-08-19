import { Link, useLocation } from 'react-router-dom'
import type { Homework, SongListItem } from '../../../shared/types'
import { useSongsList } from '../hooks/useSongs'

type Props = {
  items: Homework[]
  onPractice?: (homeworkId: string) => void
  isPracticingId?: string | null
  showPracticeCount?: boolean
}

export const HomeworkList = ({
  items,
  onPractice,
  isPracticingId = null,
  showPracticeCount = true
}: Props) => {
  const { data } = useSongsList()
  const location = useLocation()
  const allSongs: SongListItem[] | undefined = data

  console.log('HomeworkList items:', items)

  const titleFor = (id: string) => allSongs?.find(s => s.id === id)?.title ?? id

  if (!items.length) return <div>Ei vielä kotitehtäviä</div>

  return (
    <ul>
      {items.map(hw => {
        const isBusy = isPracticingId === hw.id
        return (
          <li key={hw.id}>
            <div>
              <strong>Pvm:</strong>{' '}
              {new Date(hw.createdAt).toLocaleDateString()}
            </div>

            {hw.songs.length > 0 && (
              <div>
                <strong>Kappaleet:</strong>{' '}
                {hw.songs.map((id, i) => (
                  <span key={id}>
                    <Link
                      to={`/player/${id}`}
                      state={{ from: location.pathname }}
                    >
                      {titleFor(id)}
                    </Link>
                    {i < hw.songs.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            )}

            {hw.comment && (
              <div>
                <strong>Opettajan kommentti:</strong> {hw.comment}
              </div>
            )}

            {showPracticeCount && (
              <div>
                <strong>Harjoituskerrat:</strong> {hw.practiceCount}
              </div>
            )}

            {onPractice && (
              <button
                onClick={() => onPractice(hw.id)}
                disabled={isBusy}
                aria-busy={isBusy}
              >
                {isBusy ? 'Tallennetaan…' : 'Harjoittelin'}
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
