import { useState, useEffect, useRef } from 'react'
import {
  useTeacherStudentHomework,
  useDeleteHomework
  // useUpdateHomework //
} from '../hooks/useHomework'
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
  const {
    data: homeworkData,
    isPending,
    refetch
  } = useTeacherStudentHomework(studentId)
  const { data: songsData } = useSongsList()

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const deleteHomework = useDeleteHomework({
    onSuccess: () => {
      setDeletingId(null)
      setOpenMenuId(null)
      refetch()
    },
    onError: () => {
      setDeletingId(null)
      alert('Läksyn poistaminen epäonnistui')
    }
  })

  const menuRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) setOpenMenuId(null)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

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
                  {mode === 'teacher' && (
                    <button
                      type="button"
                      className="absolute top-3 right-3 p-1 rounded-full z-10"
                      onClick={e => {
                        e.stopPropagation()
                        setOpenMenuId(openMenuId === hw.id ? null : hw.id)
                      }}
                    >
                      <Ellipsis className="w-5 h-5 text-gray-200" />
                    </button>
                  )}

                  {mode === 'teacher' && openMenuId === hw.id && (
                    <div
                      ref={menuRef}
                      className="absolute top-10 right-3 bg-[#2e2e2e] rounded-md z-20 overflow-hidden"
                    >
                      <button
                        className="block w-full text-left px-5 py-3 text-sm text-white"
                        onClick={() => {
                          setOpenMenuId(null)
                          // TODO
                        }}
                      >
                        Muokkaa
                      </button>
                      <div className="border-t border-neutral-500 border-opacity-50" />
                      <button
                        className="block w-full text-left px-5 py-3 text-sm text-white"
                        disabled={deletingId === hw.id}
                        onClick={() => {
                          if (deletingId) return
                          if (!confirm('Poistetaanko tämä kotitehtävä?')) return
                          setDeletingId(hw.id)
                          deleteHomework.mutate(hw.id)
                        }}
                      >
                        {deletingId === hw.id ? 'Poistetaan…' : 'Poista'}
                      </button>
                    </div>
                  )}

                  <h2 className="mb-1">
                    {index === 0 ? 'Tehtävä' : 'Arkistoitu tehtävä'}
                  </h2>
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
