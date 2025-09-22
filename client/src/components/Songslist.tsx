import { Link } from 'react-router-dom'
import type { SongListItem } from '../../../shared/types'
import { ChevronRight, CheckCircle } from 'lucide-react'

type Props = {
  songs: SongListItem[]
  showChevron?: boolean
  playedSet?: Set<string>
  onTogglePlayed?: (songId: string) => void
}

export const Songslist = ({
  songs,
  showChevron = false,
  playedSet,
  onTogglePlayed
}: Props) => {
  const canToggle = !!playedSet && !!onTogglePlayed

  return (
    <ul className="flex flex-col pb-20 px-10 pt-2 gap-1">
      {songs.map(song => {
        const isPlayed = !!playedSet?.has(song.id)
        return (
          <li key={song.id}>
            <div className="flex items-center gap-5 p-3 rounded-lg overflow-hidden">
              {canToggle && (
                <button
                  type="button"
                  onClick={() => onTogglePlayed?.(song.id)}
                  className="w-5 h-5 flex items-center justify-center"
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
                <h3 className="flex-1 min-w-0 truncate">{song.title}</h3>
                {showChevron && <ChevronRight className="w-5 h-5" />}
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
