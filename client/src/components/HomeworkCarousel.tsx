import { useTeacherStudentHomework } from '../hooks/useHomework'
import { useSongsList } from '../hooks/useSongs'
import { Link } from 'react-router-dom'
import type { SongListItem } from '../../../shared/types'
import SongCard from './SongCard'
import { Plus, Ellipsis } from 'lucide-react'

type Props = {
  studentId: string
  mode: 'teacher' | 'student'
}

export const HomeworkCarousel = ({ studentId, mode }: Props) => {
  const { data: homeworkData, isPending } = useTeacherStudentHomework(studentId)
  const { data: songsData } = useSongsList()

  const homework = homeworkData?.homework ?? []
  const songMap = new Map<string, SongListItem>(
    songsData?.map((song: SongListItem) => [song.id, song]) ?? []
  )

  if (isPending) return <div className="p-4">Ladataan…</div>
  if (!homework.length) return <div className="p-4">Tehtävälista on tyhjä</div>

  return (
    <div className="flex flex-col px-4">
      <div className="overflow-x-auto snap-x snap-mandatory scroll-smooth">
        <div className="flex gap-4 px-4">
          {homework
            .slice()
            .reverse()
            .map((hw, index) => (
              <div
                key={hw.id}
                className="snap-center w-full max-w-sm flex-shrink-0 rounded-lg p-4 relative"
              >
                <div className="overflow-y-auto max-h-[calc(100dvh-220px)] pt-0 px-4 pb-4 relative">
                  <div className="flex items-center justify-between mb-1">
                    <h2>{index === 0 ? 'Tehtävä' : 'Arkistoitu tehtävä'}</h2>
                    {mode === 'teacher' && (
                      <button type="button" className="p-1">
                        <Ellipsis className="w-5 h-5 text-gray-200" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-gray-300 mb-12">
                    {new Date(hw.createdAt).toLocaleDateString()}
                  </p>

                  {hw.songs.map(songId => {
                    const song = songMap.get(songId)
                    return song ? (
                      <div key={songId} className="mb-2">
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
                </div>
              </div>
            ))}

          <div className="w-[calc(50vw-144px)] flex-shrink-0" />
        </div>

        {mode === 'teacher' && (
          <div className="fixed bottom-12 left-0 w-full h-20 bg-neutral-900 z-40 flex items-center justify-center">
            <Link
              to={`/teacher/students/${studentId}/homework/create`}
              className="bg-white text-black rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
            >
              <Plus size={28} strokeWidth={2.5} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
