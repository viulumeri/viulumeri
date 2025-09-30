import { useEffect, useRef, useState } from 'react'
import { Ellipsis, X } from 'lucide-react'
import type { SongListItem, HomeworkListResponse } from '../../../shared/types'
import SongCard from './SongCard'

type HomeworkItem = HomeworkListResponse['homework'][number]

type Props = {
  mode: 'teacher' | 'student'
  hw: HomeworkItem
  isLatest?: boolean
  songMap: Map<string, SongListItem>
  headingLabel?: string
  isMenuOpen?: boolean
  onToggleMenu?: (hwId: string | null) => void

  onEdit?: (hwId: string) => void
  onDelete?: (hwId: string) => void
  editableSongs?: boolean
  onRemoveSong?: (songId: string) => void
  editableComment?: boolean
  commentDraft?: string
  onChangeComment?: (next: string) => void

  onPractice?: (hwId: string) => void
  practicePending?: boolean
}

export default function HomeworkCard({
  mode,
  hw,
  isLatest,
  songMap,
  headingLabel,
  isMenuOpen = false,
  onToggleMenu,
  onEdit,
  onDelete,
  onPractice,
  practicePending,
  editableSongs = false,
  onRemoveSong,
  editableComment = false,
  commentDraft,
  onChangeComment
}: Props) {
  const menuRef = useRef<HTMLDivElement | null>(null)

  const [isCommentEditing, setIsCommentEditing] = useState(false)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) {
        onToggleMenu?.(null)
      }
    }
    if (isMenuOpen) {
      document.addEventListener('click', onDocClick)
    }
    return () => document.removeEventListener('click', onDocClick)
  }, [isMenuOpen, onToggleMenu])

  return (
    <div className="snap-center w-[90vw] flex-shrink-0 rounded-lg pt-4 pb-4 px-8 relative">
      <div className="overflow-y-auto overflow-x-hidden max-h-[calc(100dvh-220px)] pt-0 pb-4 relative">
        {mode === 'teacher' && onToggleMenu && (
          <>
            <button
              type="button"
              className="absolute top-3 right-3 p-1 rounded-full z-10"
              onClick={e => {
                e.stopPropagation()
                onToggleMenu(isMenuOpen ? null : hw.id)
              }}
            >
              <Ellipsis className="w-5 h-5 text-gray-200" />
            </button>

            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute top-10 right-3 bg-[#2e2e2e] rounded-md z-20 overflow-hidden"
              >
                {onEdit && (
                  <button
                    className="block w-full text-left px-5 py-3 text-sm text-white"
                    onClick={() => onEdit(hw.id)}
                  >
                    Muokkaa
                  </button>
                )}
                <div className="border-t border-neutral-500 border-opacity-50" />
                {onDelete && (
                  <button
                    className="block w-full text-left px-5 py-3 text-sm text-white"
                    onClick={() => onDelete(hw.id)}
                  >
                    Poista
                  </button>
                )}
              </div>
            )}
          </>
        )}

        <h2 className="mb-1">
          {headingLabel ?? (isLatest ? 'Tehtävä' : 'Arkistoitu tehtävä')}
        </h2>
        <p className="text-xs text-gray-300 mb-12">
          {new Date(hw.createdAt).toLocaleDateString()}
        </p>

        {hw.songs.map(songId => {
          const song = songMap.get(songId)
          if (!song) return null
          return (
            <div key={songId} className="mb-5 relative">
              <div
                className={
                  editableSongs ? 'scale-95 mx-auto transition-transform' : ''
                }
              >
                <SongCard song={song} />
              </div>
              {editableSongs && onRemoveSong && (
                <button
                  type="button"
                  onClick={() => onRemoveSong(songId)}
                  className="absolute top-0 right-0 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center backdrop-blur  z-10"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )
        })}
        {editableComment ? (
          <div className="mt-5">
            <h3 className="mb-3">Opettajan kommentti</h3>
            {isCommentEditing ? (
              <textarea
                value={commentDraft ?? hw.comment ?? ''}
                onChange={e => onChangeComment?.(e.target.value)}
                onBlur={() => setIsCommentEditing(false)}
                rows={4}
                className="w-full p-3 rounded-lg bg-white/20 outline-none text-gray-300"
                placeholder="Kirjoita kommentti"
                autoFocus
              />
            ) : (
              <button
                type="button"
                className="w-full text-left p-3 rounded-lg bg-white/15"
                onClick={() => setIsCommentEditing(true)}
              >
                <h4 className="font-light text-gray-400">
                  {(commentDraft ?? hw.comment) || 'Kirjoita kommentti'}
                </h4>
              </button>
            )}
          </div>
        ) : (
          hw.comment && (
            <>
              <h3 className="mt-5 mb-3">Opettajan kommentti</h3>
              <p className="text-xs text-gray-300">{hw.comment}</p>
            </>
          )
        )}

        {mode === 'student' && isLatest && onPractice && (
          <div className="flex justify-center mt-4 pt-4">
            <button
              className="button-basic"
              onClick={() => onPractice(hw.id)}
              disabled={!!practicePending}
            >
              {practicePending ? 'Tallennetaan…' : 'Harjoittelin'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
