import { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useSongsList } from '../hooks/useSongs'
import {
  useTeacherStudentHomework,
  useUpdateHomework
} from '../hooks/useHomework'
import type { SongListItem } from '../../../shared/types'
import HomeworkCard from './HomeworkCard'
import { FloatingActionButton } from '../components/FloatingActionButton'

export function HomeworkEditPage() {
  const { studentId, homeworkId } = useParams<{
    studentId: string
    homeworkId: string
  }>()
  const navigate = useNavigate()
  const location = useLocation()

  const hwQ = useTeacherStudentHomework(studentId!)
  const songsQ = useSongsList()

  const editing = useMemo(
    () => hwQ.data?.homework.find(h => h.id === homeworkId),
    [hwQ.data, homeworkId]
  )

  const [songIds, setSongIds] = useState<string[] | null>(null)
  const currentSongIds = songIds ?? editing?.songs ?? []
  const [comment, setComment] = useState<string>('')

  useEffect(() => {
    setComment(editing?.comment ?? '')
  }, [editing?.comment])

  const songMap = useMemo(() => {
    const m = new Map<string, SongListItem>()
    ;(songsQ.data ?? []).forEach((s: SongListItem) => m.set(s.id, s))
    return m
  }, [songsQ.data])

  const updateHomework = useUpdateHomework({
    onSuccess: () => {
      navigate(`/teacher/students/${studentId}/homework`, {
        state: location.state,
        replace: true
      })
    },
    onError: err => alert(err.message || 'Läksyn päivitys epäonnistui')
  })

  const removeSong = (id: string) => {
    setSongIds(prev => {
      const base = prev ?? editing?.songs ?? []
      return base.filter(sid => sid !== id)
    })
  }

  const handleSave = () => {
    if (!homeworkId) return
    updateHomework.mutate({
      homeworkId,
      body: { songs: currentSongIds, comment }
    })
  }

  if (hwQ.isPending || songsQ.isPending)
    return <div className="p-4">Ladataan…</div>
  if (hwQ.isError)
    return <div className="p-4 text-red-300">Virhe: {hwQ.error?.message}</div>
  if (songsQ.isError)
    return (
      <div className="p-4 text-red-300">Virhe: {songsQ.error?.message}</div>
    )
  if (!editing) return <div className="p-4">Läksyä ei löytynyt</div>

  const editedHw = { ...editing, songs: currentSongIds, comment }

  return (
    <div className="flex flex-col overflow-x-hidden">
      <div className="px-[5vw]">
        <HomeworkCard
          mode="teacher"
          hw={editedHw}
          songMap={songMap}
          editableSongs
          onRemoveSong={removeSong}
          headingLabel="Muokkaa tehtävää"
          editableComment
          commentDraft={comment}
          onChangeComment={setComment}
        />
      </div>

      <FloatingActionButton onClick={handleSave} icon="check" />
    </div>
  )
}
