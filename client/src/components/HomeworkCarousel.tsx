import { useState, useEffect, useRef } from 'react'
import {
  useDeleteHomework,
  usePracticeOnce
  // useUpdateHomework //
} from '../hooks/useHomework'
import { useSongsList } from '../hooks/useSongs'
import type { SongListItem, HomeworkListResponse } from '../../../shared/types'
import SongCard from './SongCard'
import { Ellipsis } from 'lucide-react'
import { FloatingActionButton } from '../components/FloatingActionButton'

type HomeworkItem = HomeworkListResponse['homework'][number]

type Props = {
  mode: 'teacher' | 'student'
  studentId?: string
  homework: HomeworkItem[]
  isPending: boolean
  refetch: () => void | Promise<unknown>
}

export const HomeworkCarousel = ({
  mode,
  studentId,
  homework,
  isPending,
  refetch
}: Props) => {
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

  const practice = usePracticeOnce()
  const handlePractice = (homeworkId: string) => practice.mutate(homeworkId)

  const menuRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) setOpenMenuId(null)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const songMap = new Map<string, SongListItem>(
    songsData?.map((song: SongListItem) => [song.id, song]) ?? []
  )

  const scrollRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.style.scrollBehavior = 'auto'
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
      scrollRef.current.style.scrollBehavior = 'smooth'
    }
  }, [homework.length])

  if (isPending) return <div className="p-4">Ladataan…</div>
  if (!homework.length) {
    return (
      <div className="flex flex-col px-10">
        <div className="p-4 text-gray-300">Tehtävälista on tyhjä</div>
        {mode === 'teacher' && studentId && (
          <FloatingActionButton
            to={`/teacher/students/${studentId}/homework/create`}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div
        ref={scrollRef}
        className="overflow-x-auto snap-x snap-mandatory scroll-smooth"
      >
        <div className="flex gap-4">
          <div className=" w-[5vw] flex-shrink-0" />
          {homework
            .slice()
            .reverse()
            .map((hw, index) => (
              <div
                key={hw.id}
                className="snap-center w-[90vw] flex-shrink-0 rounded-lg pt-4 pb-4 px-8 relative"
              >
                <div className="overflow-y-auto max-h-[calc(100dvh-220px)] pt-0 pb-4 relative">
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
                      <div className="border-t border-neutral-500 border-opacity-50 " />
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
                    {index === homework.length - 1
                      ? 'Tehtävä'
                      : 'Arkistoitu tehtävä'}
                  </h2>
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
                  {mode === 'student' && index === homework.length - 1 && (
                    <div className="flex justify-center mt-4">
                      <button
                        className="mt-4 bg-white text-black rounded-3xl px-5 py-2 text-lg "
                        onClick={() => handlePractice(hw.id)}
                        disabled={practice.isPending}
                      >
                        {practice.isPending ? 'Tallennetaan…' : 'Harjoittelin'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          <div className="w-[5vw] flex-shrink-0" />
        </div>
        {mode === 'teacher' && studentId && (
          <FloatingActionButton
            to={`/teacher/students/${studentId}/homework/create`}
          />
        )}
      </div>
    </div>
  )
}
