import { Link } from 'react-router-dom'
import type { SongListItem } from '../../../shared/types'
import { CheckCircle, ChevronRight } from 'lucide-react'

type Props = {
  songs: SongListItem[]
  playedSet?: Set<string>
  onTogglePlayed?: (songId: string) => void
  showChevron?: boolean
  selectable?: boolean
  selectedSet?: Set<string>
  onToggleSelect?: (songId: string) => void
}

export const Songslist = ({
  songs,
  playedSet,
  onTogglePlayed,
  showChevron = false,
  selectable = false,
  selectedSet,
  onToggleSelect
}: Props) => {
  const showPlayed = !!playedSet
  const canToggle = !!onTogglePlayed

  return (
    <ul className="flex flex-col gap-1 px-4 pt-2">
      {songs.map(song => {
        const isPlayed = !!playedSet?.has(song.id)
        const isSelected = !!selectedSet?.has(song.id)

        if (selectable) {
          return (
            <li key={song.id}>
              <button
                type="button"
                onClick={() => onToggleSelect?.(song.id)}
                className={`w-full text-left flex items-center gap-4 p-3 rounded-lg ${
                  isSelected ? 'bg-white/10' : ''
                }`}
              >
                {showPlayed && !canToggle && (
                  <span className="w-5 h-5 flex items-center justify-center">
                    {isPlayed ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : null}
                  </span>
                )}
                <img
                  src={song.metadata.imgurl}
                  alt={song.title}
                  className="w-14 h-14 rounded-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="flex items-center flex-1 min-w-0">
                  <h3 className="flex-1 min-w-0 truncate">{song.title}</h3>
                </div>
              </button>
            </li>
          )
        }

        return (
          <li key={song.id}>
            <div className="flex items-center gap-4 p-3 rounded-lg">
              {showPlayed && !canToggle && (
                <span className="w-5 h-5 flex items-center justify-center">
                  {isPlayed ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : null}
                </span>
              )}
              {showPlayed && canToggle && (
                <button
                  type="button"
                  onClick={() => onTogglePlayed?.(song.id)}
                  className="w-5 h-5 flex items-center justify-center"
                  title={isPlayed ? 'Soitettu' : 'Ei soitettu'}
                >
                  {isPlayed ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <span className="w-5 h-5 rounded-full border border-white/40" />
                  )}
                </button>
              )}

              <Link
                to={`/player/${song.id}`}
                className="flex items-center gap-4 flex-1 min-w-0"
              >
                <img
                  src={song.metadata.imgurl}
                  alt={song.title}
                  className="w-14 h-14 rounded-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="flex items-center flex-1 min-w-0">
                  <h3 className="flex-1 min-w-0 truncate">{song.title}</h3>
                  {showChevron && (
                    <ChevronRight size={24} color="white" strokeWidth={2} />
                  )}
                </div>
              </Link>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
