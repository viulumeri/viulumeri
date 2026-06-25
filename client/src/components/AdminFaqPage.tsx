import { useEffect, useState } from 'react'
import { CirclePlus, FileQuestionMark, Pen } from 'lucide-react'
import { useNotification } from '../hooks/useNotification'
import { faqService, type DraftFaqBlock, type FAQ } from '../services/faq'
import { renderWithLinks } from '../utils/renderLinks'

const newTextBlock = (): DraftFaqBlock => ({
  id: crypto.randomUUID(),
  type: 'text',
  content: ''
})

const newImageBlock = (): DraftFaqBlock => ({
  id: crypto.randomUUID(),
  type: 'image',
  file: null
})

const moveDraftBlock = (
  blocks: DraftFaqBlock[],
  id: string,
  direction: -1 | 1
) => {
  const index = blocks.findIndex(block => block.id === id)
  const newIndex = index + direction

  if (index < 0 || newIndex < 0 || newIndex >= blocks.length) return blocks

  const next = [...blocks]
  const [moved] = next.splice(index, 1)
  next.splice(newIndex, 0, moved)
  return next
}

const appendBlocksToFormData = (formData: FormData, blocks: DraftFaqBlock[]) => {
  const blockMeta = blocks.map((block, index) => {
    if (block.type === 'text') {
      return {
        type: 'text',
        content: block.content,
        order: index
      }
    }

    const fileKey = `image_${index}`

    if (block.file) {
      formData.append(fileKey, block.file)
    }

    return {
      type: 'image',
      fileKey: block.file ? fileKey : undefined,
      imageUrl: block.imageUrl,
      order: index
    }
  })

  formData.append('blocks', JSON.stringify(blockMeta))
}

type BlockEditorProps = {
  blocks: DraftFaqBlock[]
  onChange: (blocks: DraftFaqBlock[]) => void
}

const BlockEditor = ({ blocks, onChange }: BlockEditorProps) => {
  const updateBlock = (id: string, updater: (block: DraftFaqBlock) => DraftFaqBlock) => {
    onChange(blocks.map(block => (block.id === id ? updater(block) : block)))
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => (
        <div
          key={block.id}
          className="space-y-3 rounded-xl border border-neutral-700 bg-neutral-800 p-4"
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <p className="font-semibold text-gray-200">
              {block.type === 'text'
                ? `Tekstiosio ${index + 1}`
                : `Kuvaosio ${index + 1}`}
            </p>

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Vaihda paikkaa</span>
              <button
                type="button"
                onClick={() => onChange(moveDraftBlock(blocks, block.id, -1))}
                disabled={index === 0}
                className="text-gray-300 hover:text-white disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => onChange(moveDraftBlock(blocks, block.id, 1))}
                disabled={index === blocks.length - 1}
                className="text-gray-300 hover:text-white disabled:opacity-30"
              >
                ↓
              </button>
            </div>

            <button
              type="button"
              onClick={() => onChange(blocks.filter(item => item.id !== block.id))}
              className="text-left text-sm text-red-400 hover:text-red-300 sm:text-right"
            >
              Poista osio
            </button>
          </div>

          {block.type === 'text' ? (
            <textarea
              className="min-h-[120px] w-full resize-none rounded-xl border border-neutral-600 bg-neutral-700 px-4 py-3 leading-relaxed text-gray-100 placeholder:text-gray-400"
              placeholder="Kirjoita tekstiosion sisältö"
              value={block.content}
              onChange={event =>
                updateBlock(block.id, current =>
                  current.type === 'text'
                    ? { ...current, content: event.target.value }
                    : current
                )
              }
            />
          ) : (
            <div className="flex flex-col items-center gap-3">
              {(block.file || block.imageUrl) && (
                <img
                  src={
                    block.file
                      ? URL.createObjectURL(block.file)
                      : block.imageUrl
                  }
                  alt="Esikatselu"
                  className="max-h-[300px] max-w-full rounded-xl border border-neutral-600"
                />
              )}

              <div className="flex flex-wrap justify-center gap-3">
                <label className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl bg-neutral-100 px-5 font-semibold text-black transition-colors hover:bg-neutral-300">
                  {block.file || block.imageUrl ? 'Valitse toinen kuva' : 'Valitse kuva'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={event => {
                      const file = event.target.files?.[0] ?? null
                      updateBlock(block.id, current =>
                        current.type === 'image'
                          ? { ...current, file, imageUrl: file ? undefined : current.imageUrl }
                          : current
                      )
                    }}
                  />
                </label>

                {(block.file || block.imageUrl) && (
                  <button
                    type="button"
                    onClick={() =>
                      updateBlock(block.id, current =>
                        current.type === 'image'
                          ? { ...current, file: null, imageUrl: undefined }
                          : current
                      )
                    }
                    className="h-12 rounded-xl bg-red-600 px-5 text-white transition-colors hover:bg-red-700"
                  >
                    Poista kuva
                  </button>
                )}
              </div>

              <p className="text-center text-sm text-gray-400">
                {block.file
                  ? block.file.name
                  : block.imageUrl
                    ? 'Nykyinen kuva säilyy'
                    : 'Ei valittua kuvatiedostoa'}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export const AdminFaqPage = () => {
  const [blocks, setBlocks] = useState<DraftFaqBlock[]>([])
  const [editBlocks, setEditBlocks] = useState<DraftFaqBlock[]>([])
  const [question, setQuestion] = useState('')
  const [showAllFaqs, setShowAllFaqs] = useState(false)
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [search, setSearch] = useState('')
  const [openFaqId, setOpenFaqId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQuestion, setEditQuestion] = useState('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const { showSuccess, showError } = useNotification()

  const loadFaqs = async () => {
    const data = await faqService.getFaqs()
    setFaqs(data)
  }

  const handleCreateFaq = async () => {
    try {
      const formData = new FormData()
      formData.append('question', question)
      formData.append('order', '1')
      appendBlocksToFormData(formData, blocks)

      await faqService.createFaq(formData)

      setQuestion('')
      setBlocks([])
      showSuccess('Kysymys lisätty onnistuneesti!')
      await loadFaqs()
    } catch (error) {
      console.error(error)
      showError('FAQ:n lisääminen epäonnistui')
    }
  }

  const startEditFaq = (faq: FAQ) => {
    setEditingId(faq._id ?? null)
    setEditQuestion(faq.question)
    setEditBlocks(
      (faq.blocks ?? []).map(block => {
        if (block.type === 'text') {
          return {
            id: crypto.randomUUID(),
            type: 'text',
            content: block.content ?? ''
          }
        }

        return {
          id: crypto.randomUUID(),
          type: 'image',
          file: null,
          imageUrl: block.imageUrl
        }
      })
    )
  }

  const handleUpdateFaq = async () => {
    if (!editingId) return

    try {
      const formData = new FormData()
      formData.append('question', editQuestion)
      appendBlocksToFormData(formData, editBlocks)

      await faqService.updateFaq(editingId, formData)

      setEditingId(null)
      setEditQuestion('')
      setEditBlocks([])
      showSuccess('Muutokset tallennettu!')
      await loadFaqs()
    } catch (error) {
      console.error(error)
      showError('Muutosten tallentaminen epäonnistui')
    }
  }

  const handleDeleteFaq = async (id: string) => {
    await faqService.deleteFaq(id)
    showSuccess('Kysymys poistettu onnistuneesti!')
    await loadFaqs()
  }

  useEffect(() => {
    void loadFaqs()
  }, [])

  const visibleFaqs = faqs
  .filter(faq => faq.question.trim())
  .sort((a, b) => {
    const aDate = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime()
    const bDate = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime()

    return sortDirection === 'asc' ? aDate - bDate : bDate - aDate
  })

  const filteredFaqs = visibleFaqs.filter(faq =>
  faq.question.toLowerCase().includes(search.toLowerCase())
)

const displayedFaqs = showAllFaqs
  ? filteredFaqs
  : filteredFaqs.slice(0, 5)

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">
        <FileQuestionMark className="admin-page-title-icon" />
        Usein kysytyt kysymykset
      </h1>

      <div className="space-y-6">
        <h3 className="flex items-center gap-3 font-semibold mt-12">
            <CirclePlus className="h-6 w-6 shrink-0" />
            Lisää uusi kysymys
          </h3>
        <div className="rounded-lg bg-neutral-900">

            <div className="mt-5 space-y-4 border-l border-neutral-700 pl-3">
              <label className="block space-y-2">
                <span className="font-semibold text-gray-200">Kysymys:</span>
                <input
                  className="w-full rounded-xl border border-neutral-600 bg-neutral-700 px-4 py-3 text-gray-100 placeholder:text-gray-400 mt-2"
                  placeholder="Kirjoita kysymys"
                  value={question}
                  onChange={event => setQuestion(event.target.value)}
                />
              </label>

              <div className="mt-5 space-y-2">
                <p className="font-semibold text-gray-200">Vastauksen rakenne:</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setBlocks(current => [...current, newTextBlock()])}
                    className="rounded-xl border border-neutral-600 bg-neutral-700 px-5 py-3 font-medium text-gray-100 transition-colors hover:bg-neutral-600"
                  >
                    Lisää tekstiosio
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlocks(current => [...current, newImageBlock()])}
                    className="rounded-xl border border-neutral-600 bg-neutral-700 px-5 py-3 font-medium text-gray-100 transition-colors hover:bg-neutral-600"
                  >
                    Lisää kuvaosio
                  </button>
                </div>
              </div>

              <BlockEditor blocks={blocks} onChange={setBlocks} />

              <div className="mt-8 border-t border-neutral-600 pt-5">
                <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleCreateFaq}
                    className="inline-flex h-11.5 w-full items-center justify-center rounded-full bg-neutral-100
                     px-6 text-base font-semibold text-black transition-colors hover:bg-neutral-300 sm:w-auto sm:min-w-[180px]"
                  >
                    Lisää kysymys
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuestion('')
                      setBlocks([])
                    }}
                    className="inline-flex h-11.5 w-full items-center justify-center rounded-full bg-red-600 px-5
                    text-base font-semibold text-white transition-colors hover:bg-red-700 sm:w-auto sm:min-w-[160px]"
                  >
                    Peruuta
                  </button>
                </div>
              </div>
            </div>
        </div>


 <div className="rounded-lg bg-neutral-900 mt-9">
  <h3 className="flex items-center gap-3 font-semibold">
    <Pen className="h-6 w-6 shrink-0" />
    Selaa ja muokkaa kysymyksiä
  </h3>

  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
  <input
    type="text"
    placeholder="Hae kysymystä..."
    value={search}
    onChange={e => setSearch(e.target.value)}
    className="flex-1 rounded-xl border border-neutral-600 bg-neutral-700 px-4 py-3 text-gray-100 placeholder:text-gray-400"
  />

  <button
    type="button"
    onClick={() =>
      setSortDirection(current => (current === 'asc' ? 'desc' : 'asc'))
    }
    className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-3 text-sm font-medium text-gray-200 transition-colors hover:bg-neutral-700"
  >
    {sortDirection === 'asc'
  ? '↑ Vanhimmat'
  : '↓ Uusimmat'}
  </button>
</div>

  <div className="mt-3 space-y-3 border-l border-neutral-700 pl-3">
    {visibleFaqs.length === 0 ? (
      <div className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-6 text-center text-gray-400 italic">
        Ei näytettäviä kysymyksiä
      </div>
    ) : (
      <>
                    {displayedFaqs.map(faq => (
                      <div key={faq._id}>
                        <button
              type="button"
              onClick={() =>
                setOpenFaqId(openFaqId === faq._id ? null : faq._id ?? null)
              }
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-neutral-600 bg-neutral-800
              px-3 py-3 text-left shadow-sm transition-colors hover:bg-neutral-600 sm:px-4"
            >
              <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
            <span className="min-w-0 break-words font-semibold">
              {faq.question}
            </span>

            <span className="shrink-0 text-sm font-medium text-gray-300">
              {faq.updatedAt &&
              faq.createdAt &&
              faq.updatedAt !== faq.createdAt
                ? `Päivitetty ${new Date(faq.updatedAt).toLocaleDateString('fi-FI')}`
                : faq.createdAt
                  ? `Lisätty ${new Date(faq.createdAt).toLocaleDateString('fi-FI')}`
                  : ''}
            </span>
            </div>

              <span
                className={`shrink-0 transition-transform duration-200 ${
                  openFaqId === faq._id ? 'rotate-180' : ''
                }`}
              >
                ▼
              </span>
            </button>

            {openFaqId === faq._id && (
              <div className="mt-2 space-y-3 rounded-xl border border-neutral-700 bg-neutral-800 p-3 shadow-inner sm:p-4">
                {editingId === faq._id ? (
                  <>
                    <label className="block space-y-2">
                      <span className="font-semibold text-gray-200">
                        Kysymys:
                      </span>
                      <input
                        className="w-full rounded-xl border border-neutral-600 bg-neutral-700 px-4 py-3 text-gray-100 placeholder:text-gray-400"
                        value={editQuestion}
                        onChange={event => setEditQuestion(event.target.value)}
                      />
                    </label>

                    <div className="space-y-2">
                      <p className="font-semibold text-gray-200">
                        Vastauksen rakenne:
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setEditBlocks(current => [...current, newTextBlock()])
                          }
                          className="rounded-xl border border-neutral-600 bg-neutral-700 px-5 py-3 text-gray-100 transition-colors hover:bg-neutral-600"
                        >
                          Lisää tekstiosio
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditBlocks(current => [...current, newImageBlock()])
                          }
                          className="rounded-xl border border-neutral-600 bg-neutral-700 px-5 py-3 text-gray-100 transition-colors hover:bg-neutral-600"
                        >
                          Lisää kuvaosio
                        </button>
                      </div>
                    </div>

                    <BlockEditor blocks={editBlocks} onChange={setEditBlocks} />

                    <div className="flex flex-col justify-center gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={handleUpdateFaq}
                        className="rounded-full bg-neutral-100 px-5 py-3 text-black sm:min-w-[140px]"
                      >
                        Tallenna
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null)
                          setEditQuestion('')
                          setEditBlocks([])
                        }}
                        className="rounded-full bg-red-600 px-5 py-3 text-white transition-colors hover:bg-red-700 sm:min-w-[140px]"
                      >
                        Peruuta
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3 rounded-xl border border-neutral-600 bg-neutral-700 px-4 py-3 text-gray-200">
                      {(faq.blocks ?? []).map((block, index) => {
                        if (block.type === 'text') {
                          return (
                            <div key={index}>
                              {renderWithLinks(block.content ?? '')}
                            </div>
                          )
                        }

                        if (!block.imageUrl) return null

                        return (
                          <img
                            key={index}
                            src={block.imageUrl}
                            alt=""
                            className="max-w-full rounded-xl border border-neutral-600"
                          />
                        )
                      })}
                    </div>

                  <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => startEditFaq(faq)}
                  >
                    Muokkaa
                  </button>

                  <button
                    type="button"
                    onClick={() => faq._id && handleDeleteFaq(faq._id)}
                  >
                    Poista
                  </button>
                </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {filteredFaqs.length > 5 && (
          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={() => setShowAllFaqs(!showAllFaqs)}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              {showAllFaqs
                ? 'Näytä vähemmän'
                : `Näytä kaikki (${filteredFaqs.length})`}
            </button>
          </div>
        )}
      </>
    )}
  </div>
</div>
    </div>
    </div>
  )
}
