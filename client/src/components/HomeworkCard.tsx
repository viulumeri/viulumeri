import { useEffect, useRef, useMemo } from 'react'
import DOMPurify from 'dompurify'
import { processYouTubeEmbeds, pauseYouTubeIframes } from '../utils/youtubeEmbed'
import { Ellipsis, X } from 'lucide-react'
import type { SongListItem, HomeworkListResponse } from '../../../shared/types'
import SongCard from './SongCard'
import TextEditor from './TextEditor'
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
  onAddSong?: () => void

  onPractice?: (hwId: string) => void
  practicePending?: boolean
}

const HomeworkCard = ({
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
  onChangeComment,
  onAddSong
}: Props) => {
  const menuRef = useRef<HTMLDivElement | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const renderedComment = useMemo(
    () => processYouTubeEmbeds(DOMPurify.sanitize(hw.comment ?? '', { ADD_ATTR: ['target'] })),
    [hw.comment]
  )

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

  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio < 0.5) pauseYouTubeIframes(el)
      },
      { threshold: [0, 0.5, 1] }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={cardRef} className="snap-center w-[90vw] max-w-4xl flex-shrink-0 rounded-lg pt-4 pb-4 px-8 relative ">
      <div
        data-card-content
        className="overflow-y-auto overflow-x-hidden max-h-[calc(100dvh-140px)] pt-0 pb-28 relative scrollbar-hide"
      >
        {mode === 'teacher' && onToggleMenu && (
          <>
            <button
              type="button"
              className="absolute top-3 right-0 p-1 rounded-full z-10"
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
        <p className="text-xs text-gray-300 mb-6">
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
                  className="absolute top-[2.5%] right-0 w-10 h-10 rounded-full bg-white/30 text-white flex items-center justify-center backdrop-blur  z-10"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )
        })}

        {editableSongs && onAddSong && (
          <div className="mb-6 flex justify-center">
            <button
              type="button"
              onClick={onAddSong}
              className="button-basic bg-white/20 text-white"
            >
              Lisää uusi kappale
            </button>
          </div>
        )}

        {editableComment ? (
          <div className="mt-5">
            <h3 className="mb-3">Opettajan kommentti</h3>
            <TextEditor
              value={commentDraft ?? hw.comment ?? ''}
              onChange={next => onChangeComment?.(next)}
              placeholder="Kirjoita kommentti"
            />
          </div>
        ) : (
          hw.comment && (
            <>
              <h3 className="mt-5 mb-3">Opettajan kommentti</h3>
              <div className="text-[14px] text-gray-400
                [&_p]:my-1
                [&_p:empty]:h-[1em]
                [&_strong]:font-semibold [&_strong]:text-gray-300
                [&_em]:italic
                [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:text-gray-200
                [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-gray-300
                [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1
                [&_ul_ul]:list-[circle]
                [&_ul_ul_ul]:list-[square]
                [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1
                [&_ol_ol]:list-[lower-alpha]
                [&_ol_ol_ol]:list-[lower-roman]
                [&_li]:my-0.5
                [&_a]:text-blue-400 [&_a]:underline
                [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded [&_iframe]:mt-2"
                dangerouslySetInnerHTML={{ __html: renderedComment }}
              />
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

export default HomeworkCard
