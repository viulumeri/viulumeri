import { useEffect, useMemo, useRef, useState } from 'react'
import { useDeleteHomework, usePracticeOnce } from '../hooks/useHomework'
import { useSongsList } from '../hooks/useSongs'
import type { SongListItem, HomeworkListResponse } from '../../../shared/types'
import { FloatingActionButton } from '../components/FloatingActionButton'
import HomeworkCard from './HomeworkCard'

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

  const songMap = useMemo(
    () => new Map<string, SongListItem>((songsData ?? []).map(s => [s.id, s])),
    [songsData]
  )

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
          <div className="w-[5vw] flex-shrink-0" />
          {homework
            .slice()
            .reverse()
            .map((hw, index) => (
              <HomeworkCard
                key={hw.id}
                mode={mode}
                hw={hw}
                isLatest={index === homework.length - 1}
                songMap={songMap}
                onPractice={mode === 'student' ? handlePractice : undefined}
                practicePending={practice.isPending}
              />
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
