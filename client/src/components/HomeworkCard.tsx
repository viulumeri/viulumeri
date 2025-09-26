import type { SongListItem, HomeworkListResponse } from '../../../shared/types'
import SongCard from './SongCard'

type HomeworkItem = HomeworkListResponse['homework'][number]

type Props = {
  mode: 'teacher' | 'student'
  hw: HomeworkItem
  isLatest: boolean
  songMap: Map<string, SongListItem>
  onPractice?: (hwId: string) => void
  practicePending?: boolean
}

export default function HomeworkCard({
  mode,
  hw,
  isLatest,
  songMap,
  onPractice,
  practicePending
}: Props) {
  return (
    <div className="snap-center w-[90vw] flex-shrink-0 rounded-lg pt-4 pb-4 px-8 relative">
      <div className="overflow-y-auto max-h-[calc(100dvh-220px)] pt-0 pb-4 relative">
        <h2 className="mb-1">{isLatest ? 'Tehtävä' : 'Arkistoitu tehtävä'}</h2>
        <p className="text-xs text-gray-300 mb-12">
          {new Date(hw.createdAt).toLocaleDateString()}
        </p>

        {hw.songs.map(songId => {
          const song = songMap.get(songId)
          return song ? (
            <div key={songId} className="mb-5">
              <SongCard song={song} />
            </div>
          ) : null
        })}

        {hw.comment && (
          <>
            <h3 className="mt-5 mb-3">Opettajan kommentti</h3>
            <p className="text-xs text-gray-300">{hw.comment}</p>
          </>
        )}

        {mode === 'student' && isLatest && onPractice && (
          <div className="flex justify-center mt-4 pt-4">
            <button
              className="button-basic"
              onClick={() => onPractice(hw.id)}
              disabled={!!practicePending}
            >
              {practicePending ? 'Tallennetaan…' : 'Harjoittelin'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
