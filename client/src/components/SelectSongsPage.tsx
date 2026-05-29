import { useMemo, useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSongsList } from '../hooks/useSongs'
import { useStudentPlayedSongs } from '../hooks/usePlayedSongs'
import type { SongListItem } from '../../../shared/types'
import { FloatingActionButton } from '../components/FloatingActionButton'
import { Header } from './Header'
import { ArrowLeft } from 'lucide-react'
import { Songslist } from './Songslist'
import { useNotification } from '../hooks/useNotification'

export const SelectSongsPage = () => {
  const { studentId, homeworkId } = useParams<{
    studentId: string
    homeworkId: string
  }>()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as
    | { studentName?: string; preselected?: string[]; addSongs?: string[] }
    | undefined

  const songs = useSongsList()
  const played = useStudentPlayedSongs(studentId!)
  const { showError } = useNotification()

  useEffect(() => {
    if (songs.isError) {
      showError(`Virhe: ${songs.error.message}`)
    }
  }, [songs.isError, songs.error, showError])

  useEffect(() => {
    if (played.isError) {
      showError(`Virhe: ${played.error.message}`)
    }
  }, [played.isError, played.error, showError])

  const preselected = state?.preselected as string[] | undefined
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(preselected ?? [])
  )

  const list: SongListItem[] = useMemo(() => songs.data ?? [], [songs.data])
  const playedSet = useMemo(
    () => new Set(played.data?.playedSongs ?? []),
    [played.data]
  )

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const confirm = () => {
    navigate(
      homeworkId
        ? `/teacher/students/${studentId}/homework/${homeworkId}/edit`
        : `/teacher/students/${studentId}/homework/create`,
      {
        replace: true,
        state: { ...(state ?? {}), addSongs: Array.from(selected) }
      }
    )
  }

  if (songs.isPending || played.isPending)
    return <div className="p-4">Ladataan…</div>

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        left={
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6 text-gray-300" />
          </button>
        }
        center={<h2>Valitse kappaleita</h2>}
      />

      <main
        className="overflow-y-auto"
        style={{ maxHeight: 'calc(100dvh - 150px)' }}
      >
        {' '}
        <Songslist
          songs={list}
          playedSet={playedSet}
          selectable
          selectedSet={selected}
          onToggleSelect={toggle}
          showChevron={false}
        />
      </main>

      <FloatingActionButton
        onClick={confirm}
        icon="check"
        className="!bottom-8"
      />
    </div>
  )
}
