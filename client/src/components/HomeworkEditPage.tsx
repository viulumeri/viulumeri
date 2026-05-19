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
import { useNotification } from '../hooks/useNotification'

export const HomeworkEditPage = () => {
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

  useEffect(() => {
    const addSongs = (location.state as { addSongs?: string[] })?.addSongs as string[] | undefined
    if (addSongs?.length) {
      setSongIds(prev => {
        const base = prev ?? editing?.songs ?? []
        const merged = Array.from(new Set([...base, ...addSongs]))
        return merged
      })
      navigate('.', {
        replace: true,
        state: { ...(location.state as { addSongs?: string[] }), addSongs: undefined }
      })
    }
  }, [location.state, navigate, editing?.songs])

  const songMap = useMemo(() => {
    const m = new Map<string, SongListItem>()
    ;(songsQ.data ?? []).forEach((s: SongListItem) => m.set(s.id, s))
    return m
  }, [songsQ.data])

  const { showError, showSuccess } = useNotification()

  const updateHomework = useUpdateHomework({
    onSuccess: () => {
      showSuccess('Läksy päivitetty onnistuneesti')
      navigate(`/teacher/students/${studentId}/homework`, {
        state: location.state,
        replace: true
      })
    },
    onError: err => showError(err.message || 'Läksyn päivitys epäonnistui')
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

  const goToPicker = () => {
    navigate(
      `/teacher/students/${studentId}/homework/${homeworkId}/select-songs`,
      { state: { preselected: currentSongIds } }
    )
  }

  if (hwQ.isPending || songsQ.isPending)
    return <div className="p-4">Ladataan…</div>

  if (hwQ.isError || songsQ.isError) {
    return (
      <div className="p-4">
        <div className="text-red-600">
          Virhe ladattaessa tietoja. Yritä myöhemmin uudelleen.
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Takaisin
        </button>
      </div>
    )
  }

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
          onAddSong={goToPicker}
        />
      </div>

      <FloatingActionButton onClick={handleSave} icon="check" />
    </div>
  )
}
