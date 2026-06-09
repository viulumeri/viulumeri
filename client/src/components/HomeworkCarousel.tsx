import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useDeleteHomework, usePracticeOnce } from '../hooks/useHomework'
import { useSongsList } from '../hooks/useSongs'
import type { SongListItem, HomeworkListResponse } from '../../../shared/types'
import { FloatingActionButton } from '../components/FloatingActionButton'
import HomeworkCard from './HomeworkCard'
import { useNotification } from '../hooks/useNotification'

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

  const navigate = useNavigate()
  const location = useLocation()

  const songMap = useMemo(
    () =>
      new Map<string, SongListItem>(
        (songsData ?? []).map((s: SongListItem) => [s.id, s])
      ),
    [songsData]
  )

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { showError, showSuccess } = useNotification()

  const deleteHomework = useDeleteHomework({
    onSuccess: () => {
      setDeletingId(null)
      showSuccess('Läksy poistettu onnistuneesti')
      setOpenMenuId(null)
      refetch()
    },
    onError: () => {
      setDeletingId(null)
      showError('Läksyn poistaminen epäonnistui')
    }
  })

  const handleDelete = (hwId: string) => {
    if (deletingId) return
    if (!confirm('Poistetaanko tämä tehtävä?')) return
    setDeletingId(hwId)
    deleteHomework.mutate(hwId)
  }

  const handleEdit = (hwId: string) => {
    const state = location.state ?? {}
    navigate(`/teacher/students/${studentId}/homework/${hwId}/edit`, { state })
  }

  const practice = usePracticeOnce({
    onSuccess: () => {
      navigate('/student/homework', { state: { justPracticed: true } })
    }
  })
  const handlePractice = (homeworkId: string) => practice.mutate(homeworkId)

  const scrollRef = useRef<HTMLDivElement | null>(null)

  const getCardWidth = () => {
    const firstCard = scrollRef.current?.firstElementChild?.children[1] as HTMLElement | undefined
    return firstCard ? firstCard.offsetWidth + 16 : window.innerWidth * 0.9 + 16
  }

  const [currentIndex, setCurrentIndex] = useState(homework.length - 1)

  useEffect(() => {
    setCurrentIndex(homework.length - 1)
  }, [homework.length])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.style.scrollBehavior = 'auto'
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
      scrollRef.current.style.scrollBehavior = 'smooth'
    }
  }, [homework.length])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleScroll = () => {
      const cardWidth = getCardWidth()
      const index = Math.round(el.scrollLeft / cardWidth)
      setCurrentIndex(Math.max(0, Math.min(index, homework.length - 1)))
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [homework.length])

  const navigateTo = (index: number) => {
    if (!scrollRef.current) return
    const cardWidth = getCardWidth()
    scrollRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' })
  }

  if (isPending) return <div className="p-4">Ladataan…</div>
  if (!homework.length) {
    return (
      <div className="flex flex-col px-10">
        <div className="p-4 text-gray-300">Tehtävälista on tyhjä</div>
        {mode === 'teacher' && studentId && (
          <FloatingActionButton
            to={`/teacher/students/${studentId}/homework/create`}
            state={location.state}
          />
        )}
      </div>
    )
  }

  const reversedHomework = homework.slice().reverse()

  const windowSize = Math.min(5, homework.length)
  const windowStart = Math.max(0, Math.min(currentIndex - 2, homework.length - windowSize))

  const SLOT = 14 // px — uniform slot width for each dot

  const dots = homework.length >= 2 ? (
    <div className="flex justify-center">
      <div
        style={{ width: windowSize * SLOT, overflow: 'hidden' }}
      >
        <div
          style={{
            display: 'flex',
            transform: `translateX(-${windowStart * SLOT}px)`,
            transition: 'transform 250ms ease'
          }}
        >
          {reversedHomework.map((hw, i) => {
            const dist = Math.abs(i - currentIndex)
            const size = dist === 0 ? 10 : dist === 1 ? 8 : 6
            const bg = dist === 0 ? '#ffffff' : dist === 1 ? '#9ca3af' : '#4b5563'
            return (
              <button
                key={hw.id}
                onClick={() => navigateTo(i)}
                style={{
                  width: SLOT,
                  height: SLOT,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer'
                }}
                aria-label={`Kotitehtävä ${i + 1}`}
              >
                <div
                  style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    background: bg,
                    transition: 'width 200ms ease, height 200ms ease, background 200ms ease'
                  }}
                />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  ) : null

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <div className="flex-1 relative">
        {homework.length >= 2 && (
          <div className="fixed inset-x-0 top-1/2 -translate-y-1/2 z-10 flex justify-between max-w-[calc(56rem+4rem)] mx-auto px-2 pointer-events-none">
            <button
              onClick={() => navigateTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="pointer-events-auto cursor-pointer rounded-full bg-black/30 p-2 text-white disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Edellinen kotitehtävä"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => navigateTo(currentIndex + 1)}
              disabled={currentIndex === homework.length - 1}
              className="pointer-events-auto cursor-pointer rounded-full bg-black/30 p-2 text-white disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Seuraava kotitehtävä"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}
        <div
          ref={scrollRef}
          className="overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide"
        >
        <div className="flex gap-4">
          <div className="w-[5vw] flex-shrink-0" />
          {reversedHomework
            .map((hw, index) => (
              <HomeworkCard
                key={hw.id}
                mode={mode}
                hw={hw}
                isLatest={index === homework.length - 1}
                songMap={songMap}
                isMenuOpen={openMenuId === hw.id}
                onToggleMenu={setOpenMenuId}
                onEdit={mode === 'teacher' ? handleEdit : undefined}
                onDelete={mode === 'teacher' ? handleDelete : undefined}
                onPractice={mode === 'student' ? handlePractice : undefined}
                practicePending={practice.isPending}
              />
            ))}
          <div className="w-[5vw] flex-shrink-0" />
        </div>
        {mode === 'teacher' && studentId && (
          <FloatingActionButton
            to={`/teacher/students/${studentId}/homework/create`}
            state={location.state}
          />
        )}
        </div>
      </div>
      {homework.length >= 2 && (
        <div className="fixed bottom-0 left-0 right-0 z-10 flex justify-center pb-16 pt-2 bg-neutral-900">
          {dots}
        </div>
      )}
    </div>
  )
}
