import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileAudio,
  GripVertical,
  ImagePlus,
  ListOrdered,
  Music,
  Music2,
  Pencil,
  Plus,
  RotateCcw,
  Minus,
  Trash2
} from 'lucide-react'
import {
  useAdminSongs,
  useCreateAdminSong,
  useDeleteAdminSong,
  useUpdateAdminSong,
  useUpdateAdminSongOrder
} from '../hooks/useAdmin'
import type {
  AdminSongFilePayload,
  AdminSongItem,
  AdminSongSavePayload
} from '../services/admin'
import { useNotification } from '../hooks/useNotification'
import { getSongImageUrl, handleSongImageError } from '../utils/songImages'

type TrackField = {
  id: 'instrumentalTrack' | 'melodyTrack' | 'slowInstrumentalTrack' | 'slowMelodyTrack'
  label: string
  existingKey: 'hasInstrumentalTrack' | 'hasMelodyTrack' | 'hasSlowInstrumentalTrack' | 'hasSlowMelodyTrack'
  deleteKey?: 'deleteMelodyTrack' | 'deleteSlowInstrumentalTrack' | 'deleteSlowMelodyTrack'
  required: boolean
}

type FormMode = 'create' | 'edit'
type SongSortMode = 'name' | 'updatedAt'

type FormState = {
  name: string
  composer: string
  isImpro: boolean
  isHidden: boolean
  instrumentalTrack: File | null
  melodyTrack: File | null
  slowInstrumentalTrack: File | null
  slowMelodyTrack: File | null
  image: File | null
  deleteMelodyTrack: boolean
  deleteSlowInstrumentalTrack: boolean
  deleteSlowMelodyTrack: boolean
  deleteImage: boolean
}

const RESULTS_PER_PAGE = 5
const SONG_SORT_STORAGE_KEY = 'admin-song-sort-mode'

const trackFields: TrackField[] = [
  {
    id: 'instrumentalTrack',
    label: 'Instrumentaali',
    existingKey: 'hasInstrumentalTrack',
    required: true
  },
  {
    id: 'melodyTrack',
    label: 'Melodia',
    existingKey: 'hasMelodyTrack',
    deleteKey: 'deleteMelodyTrack',
    required: false
  },
  {
    id: 'slowInstrumentalTrack',
    label: 'Hidas instrumentaali',
    existingKey: 'hasSlowInstrumentalTrack',
    deleteKey: 'deleteSlowInstrumentalTrack',
    required: false
  },
  {
    id: 'slowMelodyTrack',
    label: 'Hidas melodia',
    existingKey: 'hasSlowMelodyTrack',
    deleteKey: 'deleteSlowMelodyTrack',
    required: false
  }
]

const emptyFormState: FormState = {
  name: '',
  composer: '',
  isImpro: false,
  isHidden: true,
  instrumentalTrack: null,
  melodyTrack: null,
  slowInstrumentalTrack: null,
  slowMelodyTrack: null,
  image: null,
  deleteMelodyTrack: false,
  deleteSlowInstrumentalTrack: false,
  deleteSlowMelodyTrack: false,
  deleteImage: false
}

const isImproSong = (song: Pick<AdminSongItem, 'id' | 'title' | 'isImpro' | 'metadata'>) =>
  song.isImpro === true ||
  song.metadata?.isImpro === true ||
  song.title.toLowerCase().includes('impro') ||
  song.id.toLowerCase().includes('impro')

const TrackStatus = ({
  label,
  available
}: {
  label: string
  available: boolean
}) => (
  <div
    className={`flex min-w-0 items-center gap-1.5 ${
      available ? 'text-emerald-300' : 'text-neutral-500'
    }`}
  >
    <span
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
        available
          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
          : 'border-neutral-600 bg-neutral-900 text-neutral-500'
      }`}
    >
      {available ? (
        <Check className="h-3 w-3" strokeWidth={2.5} />
      ) : (
        <Minus className="h-3 w-3" strokeWidth={2} />
      )}
    </span>
    <span className="truncate">{label}</span>
  </div>
)

const getAdminSongImageUrl = (song: AdminSongItem) => {
  const imageUrl = getSongImageUrl(song.metadata, 'list')
  if (!imageUrl.startsWith('/api/')) return imageUrl

  return `${imageUrl}?v=${encodeURIComponent(song.updatedAt)}`
}

const VisibilitySwitch = ({
  isHidden,
  onToggle,
  disabled = false
}: {
  isHidden: boolean
  onToggle: () => void
  disabled?: boolean
}) => (
  <div className="flex items-center gap-1.5 text-xs text-gray-200 sm:gap-2 sm:text-sm">
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs ${
        isHidden
          ? 'bg-amber-800 text-amber-100'
          : 'bg-emerald-800 text-emerald-100'
      }`}
    >
      {isHidden ? 'Piilotettu' : 'Julkinen'}
    </span>
    <button
      type="button"
      role="switch"
      aria-checked={!isHidden}
      aria-label={`Aseta kappale ${isHidden ? 'julkiseksi' : 'piilotetuksi'}`}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:h-6 sm:w-11 ${
        isHidden ? 'bg-amber-600' : 'bg-emerald-600'
      }`}
      onClick={onToggle}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform sm:h-5 sm:w-5 ${
          isHidden ? 'translate-x-1' : 'translate-x-4 sm:translate-x-5'
        }`}
      />
    </button>
  </div>
)

const fileToPayload = (file: File): Promise<AdminSongFilePayload> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Tiedoston lukeminen epäonnistui'))
        return
      }
      resolve({
        data: reader.result,
        name: file.name,
        type: file.type
      })
    }
    reader.onerror = () => reject(new Error('Tiedoston lukeminen epäonnistui'))
    reader.readAsDataURL(file)
  })

const buildPayload = async (form: FormState): Promise<AdminSongSavePayload> => ({
  name: form.name.trim(),
  composer: form.composer.trim() || null,
  isImpro: form.isImpro,
  isHidden: form.isHidden,
  instrumentalTrack: form.instrumentalTrack
    ? await fileToPayload(form.instrumentalTrack)
    : null,
  melodyTrack: form.melodyTrack ? await fileToPayload(form.melodyTrack) : null,
  slowInstrumentalTrack: form.slowInstrumentalTrack
    ? await fileToPayload(form.slowInstrumentalTrack)
    : null,
  slowMelodyTrack: form.slowMelodyTrack
    ? await fileToPayload(form.slowMelodyTrack)
    : null,
  image: form.image ? await fileToPayload(form.image) : null,
  deleteMelodyTrack: form.deleteMelodyTrack,
  deleteSlowInstrumentalTrack: form.deleteSlowInstrumentalTrack,
  deleteSlowMelodyTrack: form.deleteSlowMelodyTrack,
  deleteImage: form.deleteImage
})

export const AdminSongsPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { data, isLoading, isFetching, error } = useAdminSongs()
  const { showSuccess, showError } = useNotification()
  const [searchInput, setSearchInput] = useState('')
  const restoredPage =
    typeof (location.state as { adminSongsPage?: unknown } | null)?.adminSongsPage === 'number'
      ? Math.max(
        0,
        Math.floor((location.state as { adminSongsPage: number }).adminSongsPage)
      )
      : 0
  const [page, setPage] = useState(restoredPage)
  const [mode, setMode] = useState<FormMode | null>(null)
  const [sortMode, setSortMode] = useState<SongSortMode>(() => {
    const saved = window.localStorage.getItem(SONG_SORT_STORAGE_KEY)
    return saved === 'updatedAt' ? 'updatedAt' : 'name'
  })
  const previousSearchInput = useRef(searchInput)
  const previousSortMode = useRef(sortMode)
  const [editingSong, setEditingSong] = useState<AdminSongItem | null>(null)
  const [form, setForm] = useState<FormState>(emptyFormState)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [orderMode, setOrderMode] = useState(false)
  const [orderedSongs, setOrderedSongs] = useState<AdminSongItem[]>([])
  const [orderDirty, setOrderDirty] = useState(false)
  const [draggingSongId, setDraggingSongId] = useState<string | null>(null)

  const createSong = useCreateAdminSong({
    onSuccess: () => {
      showSuccess('Kappale lisätty')
      closeForm()
    },
    onError: error => showError(`Kappaleen lisääminen epäonnistui: ${error.message}`)
  })

  const updateSong = useUpdateAdminSong({
    onSuccess: () => {
      showSuccess('Kappale tallennettu')
      closeForm()
    },
    onError: error => showError(`Kappaleen tallennus epäonnistui: ${error.message}`)
  })

  const updateSongVisibility = useUpdateAdminSong({
    onError: error => showError(`Kappaleen tallennus epäonnistui: ${error.message}`)
  })

  const deleteSong = useDeleteAdminSong({
    onSuccess: () => {
      showSuccess('Kappale poistettu')
      closeForm()
    },
    onError: error => showError(`Kappaleen poistaminen epäonnistui: ${error.message}`)
  })

  const updateSongOrder = useUpdateAdminSongOrder({
    onSuccess: data => {
      setOrderedSongs(data.songs)
      setOrderDirty(false)
      showSuccess('Kappaleiden järjestys tallennettu')
    },
    onError: error => showError(`Järjestyksen tallennus epäonnistui: ${error.message}`)
  })

  const songs = useMemo(() => {
    const items = [...(data?.songs ?? [])]
    if (sortMode === 'updatedAt') {
      return items.sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      )
    }

    return items.sort((left, right) => left.title.localeCompare(right.title, 'fi'))
  }, [data, sortMode])
  const searchResults = useMemo(() => {
    const normalized = searchInput.trim().toLowerCase()
    if (!normalized) return songs

    return songs.filter(song =>
      song.title.toLowerCase().includes(normalized) ||
      song.id.toLowerCase().includes(normalized)
    )
  }, [searchInput, songs])

  const paginatedSongs = searchResults.slice(
    page * RESULTS_PER_PAGE,
    (page + 1) * RESULTS_PER_PAGE
  )
  const totalPages = Math.max(Math.ceil(searchResults.length / RESULTS_PER_PAGE), 1)
  const isSubmitting = createSong.isPending || updateSong.isPending
  const shouldShowLoading = isLoading || (isFetching && !data)
  const shouldShowError = Boolean(error) && !isFetching
  const trimmedName = form.name.trim()
  const nameIsValid = trimmedName.length >= 1 && trimmedName.length <= 100
  const hasInstrumentalTrack =
    Boolean(form.instrumentalTrack) || (mode === 'edit' && editingSong?.hasInstrumentalTrack)
  const canSave = nameIsValid && hasInstrumentalTrack && !isSubmitting

  useEffect(() => {
    const searchChanged = previousSearchInput.current !== searchInput
    const sortChanged = previousSortMode.current !== sortMode

    previousSearchInput.current = searchInput
    previousSortMode.current = sortMode

    if (!searchChanged && !sortChanged) {
      return
    }

    setPage(0)
  }, [searchInput, sortMode])

  useEffect(() => {
    if (!data) return

    setPage(current => Math.min(current, totalPages - 1))
  }, [data, totalPages])

  useEffect(() => {
    window.localStorage.setItem(SONG_SORT_STORAGE_KEY, sortMode)
  }, [sortMode])

  useEffect(() => {
    if (!orderMode || orderDirty) return
    setOrderedSongs(data?.songs ?? [])
  }, [data, orderDirty, orderMode])

  const resetFiles = () => setFileInputKey(current => current + 1)

  const openOrderMode = () => {
    setOrderMode(true)
    setOrderedSongs(data?.songs ?? [])
    setOrderDirty(false)
    setSearchInput('')
    setPage(0)
  }

  const closeOrderMode = () => {
    setOrderMode(false)
    setDraggingSongId(null)
    setOrderDirty(false)
  }

  const moveOrderedSongToIndex = useCallback((songId: string, targetIndex: number) => {
    setOrderedSongs(current => {
      const fromIndex = current.findIndex(song => song.id === songId)
      if (fromIndex < 0) return current

      const next = [...current]
      const [moved] = next.splice(fromIndex, 1)
      const clampedIndex = Math.max(0, Math.min(targetIndex, next.length))
      const adjustedIndex = clampedIndex > fromIndex ? clampedIndex : clampedIndex
      if (fromIndex === adjustedIndex) return current

      next.splice(adjustedIndex, 0, moved)
      setOrderDirty(true)
      return next
    })
  }, [])

  const moveDraggedSongToPointer = useCallback((songId: string, clientY: number) => {
    const rows = Array.from(
      document.querySelectorAll<HTMLElement>('[data-order-song-id]')
    )
    const targetIndex = rows.reduce((nextIndex, row) => {
      const rowSongId = row.dataset.orderSongId
      if (!rowSongId || rowSongId === songId) return nextIndex

      const rect = row.getBoundingClientRect()
      const midpoint = rect.top + rect.height / 2
      return clientY > midpoint ? nextIndex + 1 : nextIndex
    }, 0)

    moveOrderedSongToIndex(songId, targetIndex)
  }, [moveOrderedSongToIndex])

  const onOrderPointerEnd = () => {
    setDraggingSongId(null)
  }

  useEffect(() => {
    if (!draggingSongId) return

    const onPointerMove = (event: PointerEvent) => {
      event.preventDefault()
      moveDraggedSongToPointer(draggingSongId, event.clientY)

      const edgeSize = 96
      const maxSpeed = 18
      const viewportHeight = window.innerHeight
      let scrollBy = 0

      if (event.clientY < edgeSize) {
        scrollBy = -Math.ceil(maxSpeed * ((edgeSize - event.clientY) / edgeSize))
      } else if (event.clientY > viewportHeight - edgeSize) {
        scrollBy = Math.ceil(
          maxSpeed * ((event.clientY - (viewportHeight - edgeSize)) / edgeSize)
        )
      }

      if (scrollBy !== 0) {
        const scrollContainer = document.querySelector<HTMLElement>(
          '[data-admin-scroll-container="true"]'
        )
        const songsSection = document.querySelector<HTMLElement>(
          '[data-section-id="songs"]'
        )

        if (scrollContainer && songsSection) {
          const minScrollTop = songsSection.offsetTop
          const maxScrollTop = Math.max(
            minScrollTop,
            songsSection.offsetTop + songsSection.offsetHeight - scrollContainer.clientHeight
          )
          const nextScrollTop = Math.max(
            minScrollTop,
            Math.min(maxScrollTop, scrollContainer.scrollTop + scrollBy)
          )

          scrollContainer.scrollTop = nextScrollTop
        }
      }
    }
    const onPointerEnd = () => setDraggingSongId(null)
    const onWheel = (event: WheelEvent) => event.preventDefault()

    window.addEventListener('pointermove', onPointerMove, { passive: false })
    window.addEventListener('pointerup', onPointerEnd)
    window.addEventListener('pointercancel', onPointerEnd)
    window.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerEnd)
      window.removeEventListener('pointercancel', onPointerEnd)
      window.removeEventListener('wheel', onWheel)
    }
  }, [draggingSongId, moveDraggedSongToPointer])

  const saveSongOrder = () => {
    updateSongOrder.mutate(orderedSongs.map(song => song.id))
  }

  const closeForm = () => {
    setMode(null)
    setEditingSong(null)
    setForm(emptyFormState)
    resetFiles()
  }

  const openCreateForm = () => {
    setMode('create')
    setEditingSong(null)
    setForm(emptyFormState)
    resetFiles()
  }

  const openEditForm = (song: AdminSongItem) => {
    setMode('edit')
    setEditingSong(song)
    setForm({
      ...emptyFormState,
      name: song.title,
      composer: song.metadata?.composer ?? '',
      isImpro: isImproSong(song),
      isHidden: song.isHidden
    })
    resetFiles()
  }

  const updateFile = (id: TrackField['id'] | 'image', file: File | null) => {
    setForm(current => ({
      ...current,
      [id]: file,
      ...(id === 'melodyTrack' && file ? { deleteMelodyTrack: false } : {}),
      ...(id === 'slowInstrumentalTrack' && file ? { deleteSlowInstrumentalTrack: false } : {}),
      ...(id === 'slowMelodyTrack' && file ? { deleteSlowMelodyTrack: false } : {}),
      ...(id === 'image' && file ? { deleteImage: false } : {})
    }))
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSave) return

    try {
      const payload = await buildPayload(form)
      if (mode === 'edit' && editingSong) {
        updateSong.mutate({ id: editingSong.id, body: payload })
      } else {
        createSong.mutate(payload)
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Tiedoston lukeminen epäonnistui')
    }
  }

  const onDeleteSong = (song: AdminSongItem) => {
    const confirmed = window.confirm(`Poistetaanko kappale "${song.title}"? Tätä ei voi perua.`)
    if (confirmed) {
      deleteSong.mutate(song.id)
    }
  }

  const onToggleVisibility = (song: AdminSongItem) => {
    updateSongVisibility.mutate({
      id: song.id,
      body: {
        name: song.title,
        composer: song.metadata?.composer ?? null,
        isImpro: isImproSong(song),
        isHidden: !song.isHidden
      }
    })
  }

  const openSongPlayer = (songId: string) => {
    navigate(`/player/${songId}`, {
      state: {
        returnTo: '/admin/songs',
        returnState: { adminSongsPage: page }
      }
    })
  }

  return (
    <div className="admin-page">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="admin-page-title">
            <Music className="admin-page-title-icon" />
            Kappaleet
          </h1>
          {!mode && !orderMode && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openOrderMode}
                className="button-basic inline-flex items-center justify-center gap-2"
              >
                <ListOrdered className="h-4 w-4 sm:h-5 sm:w-5" />
                Järjestys
              </button>
              <button
                type="button"
                onClick={openCreateForm}
                className="button-basic inline-flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                Lisää kappale
              </button>
            </div>
          )}
        </div>

        {orderMode ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <ListOrdered className="h-5 w-5 text-neutral-300" />
                Kappaleiden järjestys
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={closeOrderMode}
                  className="button-basic"
                >
                  Takaisin
                </button>
                <button
                  type="button"
                  onClick={saveSongOrder}
                  disabled={!orderDirty || updateSongOrder.isPending}
                  className="button-basic disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updateSongOrder.isPending ? 'Tallennetaan...' : 'Tallenna'}
                </button>
              </div>
            </div>

            {shouldShowLoading ? (
              <div className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-5 text-sm text-neutral-300">
                Ladataan kappaleita...
              </div>
            ) : shouldShowError ? (
              <div className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-5 text-sm text-rose-300">
                Kappaleiden lataus epäonnistui
              </div>
            ) : (
              <ul
                className="flex flex-col gap-1 px-4 pt-2"
                onPointerUp={onOrderPointerEnd}
                onPointerCancel={onOrderPointerEnd}
                onLostPointerCapture={onOrderPointerEnd}
              >
                {orderedSongs.map(song => (
                  <li
                    key={song.id}
                    data-order-song-id={song.id}
                    className={`rounded-lg transition ${
                      draggingSongId === song.id ? 'bg-white/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4 rounded-lg p-3">
                      <button
                        type="button"
                        className={`touch-none rounded-full p-2 text-neutral-300 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 ${
                          draggingSongId === song.id ? 'cursor-grabbing' : 'cursor-grab'
                        }`}
                        aria-label={`Siirrä kappaletta ${song.title}`}
                        onPointerDown={event => {
                          event.preventDefault()
                          setDraggingSongId(song.id)
                        }}
                      >
                        <GripVertical className="h-5 w-5" />
                      </button>
                      <img
                        src={getAdminSongImageUrl(song)}
                        alt={song.title}
                        className="h-14 w-14 rounded-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={handleSongImageError}
                      />
                      <div className="flex min-w-0 flex-1 items-center">
                        <h3 className="min-w-0 flex-1 truncate">{song.title}</h3>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : mode ? (
          <form onSubmit={onSubmit} className="admin-card space-y-4 sm:space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Music2 className="h-5 w-5 text-neutral-300" />
                {mode === 'edit' ? 'Muokkaa kappaletta' : 'Lisää kappale'}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="button-basic self-start sm:self-auto"
              >
                Takaisin
              </button>
            </div>

            <section>
              <label
                className="flex items-center justify-between gap-3 text-sm font-medium text-neutral-200"
                htmlFor="admin-song-name"
              >
                <span>Kappaleen nimi</span>
                <span className="text-sky-300">Pakollinen</span>
              </label>
              <input
                id="admin-song-name"
                type="text"
                value={form.name}
                onChange={event =>
                  setForm(current => ({ ...current, name: event.target.value }))
                }
                minLength={1}
                maxLength={100}
                required
                className="mt-2 w-full rounded-md border border-neutral-600 bg-neutral-700 px-3 py-2 text-gray-100 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-2 flex justify-end text-xs text-neutral-500">
                {trimmedName.length}/100
              </div>

              <label
                className="mt-4 block text-sm font-medium text-neutral-200"
                htmlFor="admin-song-composer"
              >
                Säveltäjä
              </label>
              <input
                id="admin-song-composer"
                type="text"
                value={form.composer}
                onChange={event =>
                  setForm(current => ({ ...current, composer: event.target.value }))
                }
                maxLength={100}
                className="mt-2 w-full rounded-md border border-neutral-600 bg-neutral-700 px-3 py-2 text-gray-100 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />

              <label className="mt-5 flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={form.isImpro}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      isImpro: event.target.checked
                    }))
                  }
                />
                Impro-kappale
              </label>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-medium text-neutral-200">Näkyvyys</span>
                <VisibilitySwitch
                  isHidden={form.isHidden}
                  onToggle={() =>
                    setForm(current => ({
                      ...current,
                      isHidden: !current.isHidden
                    }))
                  }
                />
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2">
                <FileAudio className="h-5 w-5 text-neutral-300" />
                <h2 className="text-lg font-semibold">Ääniraidat</h2>
              </div>

              <div className="grid gap-4">
                {trackFields.map(field => {
                  const file = form[field.id]
                  const hasExisting = mode === 'edit' && editingSong?.[field.existingKey]
                  const isMarkedForDelete =
                    field.deleteKey ? form[field.deleteKey] : false

                  return (
                    <div key={field.id}>
                      <label className="block">
                        <span className="flex items-center justify-between gap-3 text-sm font-medium text-neutral-200">
                          {field.label}
                          <span className={field.required ? 'text-sky-300' : 'text-neutral-500'}>
                            {field.required ? 'Pakollinen' : 'Valinnainen'}
                          </span>
                        </span>
                        {hasExisting && !isMarkedForDelete && (
                          <span className="mt-1 block text-xs text-neutral-400">
                            Nykyinen tiedosto tallessa
                          </span>
                        )}
                        <input
                          key={`${fileInputKey}-${field.id}`}
                          type="file"
                          accept="audio/*,.mp3"
                          required={mode === 'create' && field.required}
                          onChange={event =>
                            updateFile(field.id, event.target.files?.[0] ?? null)
                          }
                          className="mt-2 block w-full min-w-0 rounded-md border border-neutral-600 bg-neutral-700 px-2 py-1.5 text-xs text-gray-100 file:mr-2 file:rounded-md file:border-0 file:bg-neutral-600 file:px-2 file:py-1 file:text-xs file:text-gray-100 hover:file:bg-neutral-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 sm:px-3 sm:py-2 sm:text-sm sm:file:mr-3 sm:file:px-3 sm:file:py-1.5 sm:file:text-sm"
                        />
                      </label>
                      {file && (
                        <span className="mt-2 hidden truncate text-xs text-neutral-400 sm:block">{file.name}</span>
                      )}
                      {field.deleteKey && hasExisting && (
                        <label className="mt-2 flex items-center gap-2 text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={isMarkedForDelete}
                            onChange={event =>
                              setForm(current => ({
                                ...current,
                                [field.deleteKey!]: event.target.checked,
                                [field.id]: event.target.checked ? null : current[field.id]
                              }))
                            }
                          />
                          Poista nykyinen tiedosto tallennettaessa
                        </label>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2">
                <ImagePlus className="h-5 w-5 text-neutral-300" />
                <h2 className="text-lg font-semibold">Kuva</h2>
              </div>

              <label className="block">
                <span className="flex items-center justify-between gap-3 text-sm font-medium text-neutral-200">
                  Kappaleen kuva
                  <span className="text-neutral-500">Valinnainen</span>
                </span>
                {mode === 'edit' && editingSong?.hasImage && !form.deleteImage && (
                  <span className="mt-1 block text-xs text-neutral-400">
                    Nykyinen original.jpg ja luodut kuvakoot tallessa
                  </span>
                )}
                <input
                  key={`${fileInputKey}-image`}
                  type="file"
                  accept="image/*"
                  onChange={event => updateFile('image', event.target.files?.[0] ?? null)}
                  className="mt-2 block w-full min-w-0 rounded-md border border-neutral-600 bg-neutral-700 px-2 py-1.5 text-xs text-gray-100 file:mr-2 file:rounded-md file:border-0 file:bg-neutral-600 file:px-2 file:py-1 file:text-xs file:text-gray-100 hover:file:bg-neutral-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 sm:px-3 sm:py-2 sm:text-sm sm:file:mr-3 sm:file:px-3 sm:file:py-1.5 sm:file:text-sm"
                />
                {form.image && (
                  <span className="mt-2 hidden truncate text-xs text-neutral-400 sm:block">{form.image.name}</span>
                )}
              </label>
              {mode === 'edit' && editingSong?.hasImage && (
                <label className="mt-2 flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.deleteImage}
                    onChange={event =>
                      setForm(current => ({
                        ...current,
                        deleteImage: event.target.checked,
                        image: event.target.checked ? null : current.image
                      }))
                    }
                  />
                  Poista nykyinen kuva tallennettaessa
                </label>
              )}
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  if (editingSong) {
                    openEditForm(editingSong)
                  } else {
                    setForm(emptyFormState)
                    resetFiles()
                  }
                }}
                className="button-basic inline-flex items-center justify-center gap-2"
              >
                <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
                Tyhjennä
              </button>
              <button
                type="submit"
                disabled={!canSave}
                className="button-basic inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                {isSubmitting ? 'Tallennetaan...' : 'Tallenna'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <form
                className="flex w-full max-w-lg items-center space-x-2"
                onSubmit={event => event.preventDefault()}
              >
                <label className="sr-only">Etsi kappaleita</label>
                <div className="relative w-full">
                  <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
                    <Music size={16} strokeWidth={1.5} />
                  </div>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-default-medium bg-neutral-secondary-medium px-3 py-2.5 ps-10 text-sm text-heading placeholder:text-body focus:border-brand focus:ring-brand"
                    placeholder="Etsi kappaleita..."
                    onChange={event => setSearchInput(event.target.value)}
                    value={searchInput}
                  />
                </div>
              </form>

              <label className="flex items-center gap-2 text-sm text-neutral-300">
                <span>Järjestys</span>
                <select
                  value={sortMode}
                  onChange={event => setSortMode(event.target.value as SongSortMode)}
                  className="rounded-md border border-neutral-600 bg-neutral-700 px-3 py-2 text-sm text-gray-100 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Nimi</option>
                  <option value="updatedAt">Viimeksi muokattu</option>
                </select>
              </label>
            </div>

            <div className="overflow-hidden rounded-lg border border-neutral-700 bg-neutral-800">
              <div className="hidden grid-cols-[2.5rem_minmax(0,2fr)_minmax(10rem,1fr)_6rem] gap-4 px-4 py-3 text-sm font-semibold text-neutral-400 md:grid">
                <div aria-hidden="true"></div>
                <div>Nimi</div>
                <div>Tiedostot</div>
                <div>Toiminnot</div>
              </div>

              {shouldShowLoading ? (
                <div className="border-t border-neutral-700 px-4 py-5 text-sm text-neutral-300">
                  Ladataan kappaleita...
                </div>
              ) : shouldShowError ? (
                <div className="border-t border-neutral-700 px-4 py-5 text-sm text-rose-300">
                  Kappaleiden lataus epäonnistui
                </div>
              ) : paginatedSongs.length > 0 ? (
                <div className="divide-y divide-neutral-700">
                  {paginatedSongs.map(song => (
                    <Fragment key={song.id}>
                      <div className="relative grid w-full grid-cols-[2.25rem_minmax(0,1fr)_auto] gap-3 px-3 py-3 md:grid-cols-[2.5rem_minmax(0,2fr)_minmax(10rem,1fr)_6rem] md:gap-4 md:px-4 md:pb-12">
                        <button
                          type="button"
                          onClick={() => openSongPlayer(song.id)}
                          className="group h-9 w-9 cursor-pointer overflow-hidden rounded-full ring-offset-2 ring-offset-neutral-800 transition hover:scale-105 hover:ring-2 hover:ring-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 md:h-10 md:w-10"
                          aria-label={`Avaa kappale ${song.title}`}
                          title="Avaa soitin"
                        >
                          <img
                            src={getAdminSongImageUrl(song)}
                            alt={song.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                            onError={handleSongImageError}
                          />
                        </button>
                        <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                            <button
                              type="button"
                              onClick={() => openSongPlayer(song.id)}
                              className="min-w-0 max-w-full cursor-pointer truncate text-left text-sm font-semibold text-neutral-100 underline-offset-4 hover:text-sky-300 hover:underline focus:outline-none focus:text-sky-300 focus:underline md:text-base"
                            >
                              {song.title}
                            </button>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                song.isHidden
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-emerald-500/20 text-emerald-400'
                              }`}
                            >
                              {song.isHidden ? 'Piilotettu' : 'Julkinen'}
                            </span>
                            {isImproSong(song) && (
                              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                                Impro
                              </span>
                            )}
                          </div>
                          <div className="truncate text-[11px] text-neutral-400 md:text-xs">{song.id}</div>
                        </div>
                        <div className="col-span-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] md:col-span-1 md:flex md:flex-col md:gap-1 md:text-xs">
                          <TrackStatus
                            label="Instrumentaali"
                            available={song.hasInstrumentalTrack}
                          />
                          <TrackStatus
                            label="Melodia"
                            available={song.hasMelodyTrack}
                          />
                          <TrackStatus
                            label="Hidas instr."
                            available={song.hasSlowInstrumentalTrack}
                          />
                          <TrackStatus
                            label="Hidas mel."
                            available={song.hasSlowMelodyTrack}
                          />
                        </div>
                        <div className="col-span-3 flex flex-nowrap items-start justify-end gap-2 md:col-span-1 md:flex-wrap">
                          <button
                            type="button"
                            onClick={() => openEditForm(song)}
                            className="button-basic inline-flex h-10 w-10 min-w-10 items-center justify-center rounded-full !px-0 !py-0"
                            aria-label="Muokkaa kappaletta"
                            title="Muokkaa kappaletta"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteSong(song)}
                            className="button-basic inline-flex h-10 w-10 min-w-10 items-center justify-center rounded-full !px-0 !py-0"
                            aria-label="Poista kappale"
                            title="Poista kappale"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="col-span-3 flex justify-end md:absolute md:bottom-2 md:right-4 md:col-span-1">
                          <VisibilitySwitch
                            isHidden={song.isHidden}
                            onToggle={() => onToggleVisibility(song)}
                            disabled={updateSongVisibility.isPending}
                          />
                        </div>
                      </div>
                    </Fragment>
                  ))}
                </div>
              ) : (
                <div className="border-t border-neutral-700 px-4 py-5 text-sm text-neutral-300">
                  Ei kappaleita
                </div>
              )}

              <div className="flex items-center justify-between gap-2 border-t border-neutral-700 bg-neutral-900 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setPage(current => Math.max(current - 1, 0))}
                  disabled={page === 0}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 text-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Edellinen sivu"
                >
                  <ChevronLeft size={18} strokeWidth={1.5} />
                </button>
                <span className="text-sm text-neutral-300">
                  {searchResults.length > 0 ? page + 1 : 0} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPage(current => Math.min(current + 1, totalPages - 1))
                  }
                  disabled={page >= totalPages - 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 text-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Seuraava sivu"
                >
                  <ChevronRight size={18} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
