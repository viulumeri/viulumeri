import { Link } from 'react-router-dom'
import { useSongsList } from '../hooks/useSongs'
import type { SongListItem } from '../../../shared/types'
import { ChevronRight, CheckCircle } from 'lucide-react'

type Props = {
  showChevron?: boolean
  playedSet?: Set<string>
  onTogglePlayed?: (songId: string) => void
}

export const Songslist = ({
  showChevron = false,
  playedSet,
  onTogglePlayed
}: Props) => {
  const { isPending, isError, data, error } = useSongsList()
  const canToggle = !!playedSet && !!onTogglePlayed

  if (isPending) return <span>Loading...</span>
  if (isError) return <span>Error: {error.message}</span>

  return (
    <div>
      <h1 className="px-4 pb-4">Kappaleet</h1>
      <ul className="flex flex-col pb-20 px-10">
        {data.map((song: SongListItem) => {
          const isPlayed = !!playedSet?.has(song.id)
          return (
            <li key={song.id}>
              <div className="flex items-center gap-5 p-3 rounded-lg overflow-hidden">
                {canToggle ? (
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
                ) : (
                  <>
                    {isPlayed ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-none" />
                    ) : (
                      <span className="w-5 h-5 flex-none" />
                    )}
                  </>
                )}

                <Link
                  to={`/player/${song.id}`}
                  className="flex items-center gap-5 flex-1 min-w-0"
                >
                  <img
                    src={song.metadata.imgurl}
                    alt={song.title}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <h3 className="flex-1 min-w-0 truncate">{song.title}</h3>
                  {showChevron && <ChevronRight className="w-5 h-5" />}
                </Link>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
