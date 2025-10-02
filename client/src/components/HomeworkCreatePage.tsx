import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSongsList } from '../hooks/useSongs'
import { useCreateHomework } from '../hooks/useHomework'
import type { SongListItem, HomeworkListResponse } from '../../../shared/types'
import HomeworkCard from './HomeworkCard'
import { FloatingActionButton } from '../components/FloatingActionButton'
import { X } from 'lucide-react'

type HomeworkItem = HomeworkListResponse['homework'][number]

export function HomeworkCreatePage() {
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const songsQ = useSongsList()

  const [songIds, setSongIds] = useState<string[]>([])
  const [comment, setComment] = useState<string>('')

  useEffect(() => {
    const ids: string[] = (location.state as any)?.addSongs ?? []
    if (!ids.length) return

    setSongIds(prev => [...new Set([...prev, ...ids])])
    navigate('.', { replace: true })
  }, [])

  const songMap = useMemo(
    () =>
      new Map<string, SongListItem>(
        (songsQ.data ?? []).map((s: SongListItem) => [s.id, s])
      ),
    [songsQ.data]
  )

  const createdAtISO = useMemo(() => new Date().toISOString(), [])
  const draftHw = useMemo(
    () =>
      ({
        id: 'draft',
        songs: songIds,
        comment,
        createdAt: createdAtISO
      }) as unknown as HomeworkItem,
    [songIds, comment, createdAtISO]
  )

  const createHw = useCreateHomework()

  const handleCreate = () => {
    if (!studentId) return
    createHw.mutate(
      {
        studentId,
        songs: songIds,
        comment
      },
      {
        onSuccess: () => {
          navigate(`/teacher/students/${studentId}/homework`, {
            state: location.state,
            replace: true
          })
        },
        onError: (err: any) =>
          alert(err?.message || 'Läksyn luonti epäonnistui')
      }
    )
  }

  const goToPicker = () => {
    navigate(`/teacher/students/${studentId}/homework/create/select-songs`, {
      state: { preselected: songIds }
    })
  }

  if (songsQ.isPending) return <div className="p-4">Ladataan…</div>
  if (songsQ.isError)
    return (
      <div className="p-4 text-red-300">Virhe: {songsQ.error?.message}</div>
    )

  return (
    <div className="flex flex-col overflow-x-hidden relative">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center z-50"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="px-[5vw]">
        <HomeworkCard
          mode="teacher"
          hw={draftHw}
          songMap={songMap}
          headingLabel="Tehtävä"
          editableSongs
          onRemoveSong={id => setSongIds(prev => prev.filter(x => x !== id))}
          editableComment
          commentDraft={comment}
          onChangeComment={setComment}
          onAddSong={goToPicker}
        />
      </div>

      <FloatingActionButton onClick={handleCreate} icon="check" />
    </div>
  )
}
