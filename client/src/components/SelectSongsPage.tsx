import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSongsList } from '../hooks/useSongs'
import { useStudentPlayedSongs } from '../hooks/usePlayedSongs'
import type { SongListItem } from '../../../shared/types'
import { FloatingActionButton } from '../components/FloatingActionButton'
import { Header } from './Header'
import { ArrowLeft } from 'lucide-react'
import { Songslist } from './Songslist'

export function SelectSongsPage() {
  const { studentId, homeworkId } = useParams<{
    studentId: string
    homeworkId: string
  }>()
  const navigate = useNavigate()
  const location = useLocation()

  const songs = useSongsList()
  const played = useStudentPlayedSongs(studentId!)

  const preselected = (location.state as any)?.preselected as
    | string[]
    | undefined
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
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const confirm = () => {
    navigate(`/teacher/students/${studentId}/homework/${homeworkId}/edit`, {
      replace: true,
      state: { addSongs: Array.from(selected) }
    })
  }

  if (songs.isPending || played.isPending)
    return <div className="p-4">Ladataan…</div>
  if (songs.isError)
    return <div className="p-4 text-red-300">Virhe: {songs.error.message}</div>
  if (played.isError)
    return <div className="p-4 text-red-300">Virhe: {played.error.message}</div>

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

      <FloatingActionButton onClick={confirm} icon="check" />
    </div>
  )
}
