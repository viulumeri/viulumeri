import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSongsList } from '../hooks/useSongs'
import { useCreateHomework } from '../hooks/useHomework'
import type { SongListItem, HomeworkListResponse } from '../../../shared/types'
import HomeworkCard from './HomeworkCard'
import { FloatingActionButton } from '../components/FloatingActionButton'
import { X } from 'lucide-react'
import { useNotification } from '../hooks/useNotification'

type HomeworkItem = HomeworkListResponse['homework'][number]

type HomeworkCreateState = {
  studentName?: string
  comment?: string
  preselected?: string[]
}

export const HomeworkCreatePage = () => {
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as HomeworkCreateState | undefined

  const songsQ = useSongsList()

  const [songIds, setSongIds] = useState<string[]>(state?.preselected ?? [])
  const [comment, setComment] = useState<string>(state?.comment ?? '')

  const syncDraftState = (nextComment: string, nextSongIds: string[]) => {
    navigate('.', {
      replace: true,
      state: {
        ...(state ?? {}),
        comment: nextComment,
        preselected: nextSongIds
      }
    })
  }

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
  const { showError, showSuccess } = useNotification()

  const errorShownRef = useRef(false)
  useEffect(() => {
    if (songsQ.isError && !errorShownRef.current) {
      showError('Kappaleiden lataus epäonnistui. Yritä päivittää sivu.')
      errorShownRef.current = true
    }
  }, [songsQ.isError, showError])

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
          showSuccess('Läksy luotu onnistuneesti')
          navigate(`/teacher/students/${studentId}/homework`, {
            state: { studentName: state?.studentName},
            replace: true
          })
        },
        onError: (err: { message?: string }) =>
          showError(err?.message || 'Läksyn luonti epäonnistui')
      }
    )
  }

  const goToPicker = () => {
    navigate(`/teacher/students/${studentId}/homework/create/select-songs`, {
      state: { ...(state ?? {}), comment, preselected: songIds }
    })
  }

  if (songsQ.isPending) return <div className="p-4">Ladataan…</div>
  if (songsQ.isError)
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 mb-4">
          Kappaleiden lataus epäonnistui
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Päivitä sivu
        </button>
      </div>
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
          onRemoveSong={id => {
            const next = songIds.filter(x => x !== id)
            setSongIds(next)
            syncDraftState(comment, next)
          }}
          editableComment
          commentDraft={comment}
          onChangeComment={next => {
            setComment(next)
            syncDraftState(next, songIds)
          }}
          onAddSong={goToPicker}
        />
      </div>

      <FloatingActionButton onClick={handleCreate} icon="check" />
    </div>
  )
}
