import { useEffect, useState } from 'react'
import { CirclePlus, FileQuestionMark, Pen } from 'lucide-react'
import { useNotification } from '../hooks/useNotification'
import { faqService, type FAQ, type DraftFaqBlock } from '../services/faq'
import { renderWithLinks } from '../utils/renderLinks'

export const AdminFaqPage = () => {
  const [blocks, setBlocks] = useState<DraftFaqBlock[]>([])
  const [editBlocks, setEditBlocks] = useState<DraftFaqBlock[]>([])
  const [question, setQuestion] = useState('')
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [createFaqOpen, setCreateFaqOpen] = useState(false)
  const [browseFaqOpen, setBrowseFaqOpen] = useState(false)
  const [openFaqId, setOpenFaqId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQuestion, setEditQuestion] = useState('')

  const { showSuccess, showError } = useNotification()

  const loadFaqs = async () => {
    const data = await faqService.getFaqs()
    setFaqs(data)
  }

   const addTextBlock = () => {
  setBlocks(prev => [
    ...prev,
    {
      id: crypto.randomUUID(),
      type: 'text',
      content: ''
    }
  ])
}

const addImageBlock = () => {
  setBlocks(prev => [
    ...prev,
    {
      id: crypto.randomUUID(),
      type: 'image',
      file: null
    }
  ])
}

const removeBlock = (id: string) => {
  setBlocks(prev => prev.filter(block => block.id !== id))
}

const addEditTextBlock = () => {
  setEditBlocks(prev => [
    ...prev,
    {
      id: crypto.randomUUID(),
      type: 'text',
      content: ''
    }
  ])
}

const addEditImageBlock = () => {
  setEditBlocks(prev => [
    ...prev,
    {
      id: crypto.randomUUID(),
      type: 'image',
      file: null
    }
  ])
}

const removeEditBlock = (id: string) => {
  setEditBlocks(prev => prev.filter(block => block.id !== id))
}

const moveBlock = (id: string, direction: -1 | 1) => {
  setBlocks(prev => {
    const index = prev.findIndex(block => block.id === id)
    const newIndex = index + direction

    if (index < 0 || newIndex < 0 || newIndex >= prev.length) {
      return prev
    }

    const next = [...prev]
    const [moved] = next.splice(index, 1)
    next.splice(newIndex, 0, moved)

    return next
  })
}

const moveEditBlock = (id: string, direction: -1 | 1) => {
  setEditBlocks(prev => {
    const index = prev.findIndex(block => block.id === id)
    const newIndex = index + direction

    if (index < 0 || newIndex < 0 || newIndex >= prev.length) {
      return prev
    }

    const next = [...prev]
    const [moved] = next.splice(index, 1)
    next.splice(newIndex, 0, moved)

    return next
  })
}

const handleCreateFaq = async () => {
  try {
    const formData = new FormData()

    formData.append('question', question)
    formData.append('order', '1')

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
        fileKey,
        order: index
      }
    })

    formData.append('blocks', JSON.stringify(blockMeta))

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

  const formData = new FormData()
  formData.append('question', editQuestion)

  const blockMeta = editBlocks.map((block, index) => {
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

  await faqService.updateFaq(editingId, formData)

  setEditingId(null)
  setEditQuestion('')
  setEditBlocks([])

  showSuccess('Muutokset tallennettu!')
  await loadFaqs()
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
    .sort(
      (a, b) =>
        new Date(a.createdAt ?? 0).getTime() -
        new Date(b.createdAt ?? 0).getTime()
    )

  return (
    <div className="space-y-4 p-5 pb-24">
      <h1 className="flex items-center gap-3">
        <FileQuestionMark className="w-8 h-8" />
        Usein kysytyt kysymykset
      </h1>

     <div className="mt-8 bg-neutral-900 rounded-lg p-4 space-y-4">


            <h3 className="flex items-center gap-3">
        <FileQuestionMark className="w-8 h-8" />
        Usein kysyttyjen kysymysten hallinta
      </h3>
            <div className="bg-neutral-900 rounded-lg p-3 mb-4">

            <button
              type="button"
              onClick={() => setCreateFaqOpen(!createFaqOpen)}
              className="w-full flex items-center justify-between gap-3
              bg-neutral-800 hover:bg-neutral-700 border border-neutral-700
              rounded-md px-4 py-3 text-left transition-colors px-4 py-3 min-h-[58px]"
            >
             <span className="flex items-center gap-3 font-semibold">
            <CirclePlus className="w-6 h-6 shrink-0" />
            Lisää uusi kysymys
            </span>

             <span
              className={`
                flex items-center justify-center
                text-gray-300 text-lg font-bold
                transition-transform duration-200
                ${createFaqOpen ? 'rotate-180' : ''}
              `}
            >
              ▼
            </span>
            </button>

              {createFaqOpen && (
              <div className="space-y-2 mt-3 pl-3 border-l border-neutral-700">
                <p className="font-semibold text-gray-200">
                      Kysymys:
                    </p>

                    <input
                      className="
                      w-full
                      bg-neutral-700
                      border border-neutral-600
                      rounded-xl
                      px-4 py-3
                      text-gray-100
                      placeholder:text-gray-400
                      "
                      placeholder="Kirjoita kysymys"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                                      />

                    <div className="mt-1">
                      <p className="font-semibold text-gray-200">
                        Vastauksen rakenne:
                      </p>

                      <div className="flex justify-left gap-4 mt-2">
                        <button
                          type="button"
                          onClick={addTextBlock}
                          className="
                            h-[48px]
                            bg-neutral-700
                            border border-neutral-600
                            rounded-xl
                            px-5
                            text-gray-100
                            font-medium
                            hover:bg-neutral-600
                            transition-colors
                          "
                        >
                          Lisää tekstiosio
                        </button>

                        <button
                          type="button"
                          onClick={addImageBlock}
                          className="
                            h-[48px]
                            bg-neutral-700
                            border border-neutral-600
                            rounded-xl
                            px-5
                            text-gray-100
                            font-medium
                            hover:bg-neutral-600
                            transition-colors
                            -mx-1
                          "
                        >
                          Lisää kuvaosio
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {blocks.map((block, index) => (
                        <div
                          key={block.id}
                          className="
                            bg-neutral-800
                            border border-neutral-700
                            rounded-xl
                            p-4
                            space-y-3
                          "
                        >
                          <div className="relative flex items-center">
                            <p className="font-semibold text-gray-200">
                              {block.type === 'text'
                                ? `Tekstiosio ${index + 1}`
                                : `Kuvaosio ${index + 1}`}
                            </p>

                            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                              <span className="text-sm text-gray-400">
                                Vaihda paikkaa
                              </span>

                              <button
                                type="button"
                                onClick={() => moveBlock(block.id, -1)}
                                disabled={index === 0}
                                className="text-gray-300 hover:text-white disabled:opacity-30"
                              >
                                ↑
                              </button>

                              <button
                                type="button"
                                onClick={() => moveBlock(block.id, 1)}
                                disabled={index === blocks.length - 1}
                                className="text-gray-300 hover:text-white disabled:opacity-30"
                              >
                                ↓
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeBlock(block.id)}
                              className="absolute right-0 text-sm text-red-400 hover:text-red-300"
                            >
                              Poista osio
                            </button>
                          </div>

                          {block.type === 'text' ? (
                            <textarea
                              className="
                                w-full
                                bg-neutral-700
                                border border-neutral-600
                                rounded-xl
                                px-4 py-3
                                text-gray-100
                                placeholder:text-gray-400
                                leading-relaxed
                                min-h-[120px]
                                resize-none
                              "
                              placeholder="Kirjoita tekstiosion sisältö"
                              value={block.content}
                              onChange={(e) => {
                                setBlocks(prev =>
                                  prev.map(item =>
                                    item.id === block.id && item.type === 'text'
                                      ? { ...item, content: e.target.value }
                                      : item
                                  )
                                )
                              }}
                            />
                          ) : (
                                            <div className="flex flex-col items-center gap-3">
                    {block.file ? (
                      <>
                        <img
                          src={URL.createObjectURL(block.file)}
                          alt="Esikatselu"
                          className="
                            rounded-xl
                            border border-neutral-600
                            max-w-full
                            max-h-[300px]
                          "
                        />

                        <div className="flex flex-wrap justify-center gap-3">
                          <label
                            className="
                              h-[48px]
                              px-5
                              inline-flex items-center justify-center
                              bg-neutral-100
                              text-black
                              rounded-xl
                              cursor-pointer
                              font-semibold
                              hover:bg-neutral-300
                              transition-colors
                            "
                          >
                            Valitse toinen kuva

                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0] ?? null

                                setBlocks(prev =>
                                  prev.map(item =>
                                    item.id === block.id && item.type === 'image'
                                      ? { ...item, file }
                                      : item
                                  )
                                )
                              }}
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              setBlocks(prev =>
                                prev.map(item =>
                                  item.id === block.id && item.type === 'image'
                                    ? { ...item, file: null }
                                    : item
                                )
                              )
                            }}
                            className="
                              h-[48px]
                              px-5
                              bg-red-600
                              hover:bg-red-700
                              text-white
                              rounded-xl
                              transition-colors
                            "
                          >
                            Poista kuva
                          </button>
                        </div>

                        <p className="text-sm text-gray-400 text-center">
                          {block.file.name}
                        </p>
                      </>
                    ) : (
                      <>
                        <label
                          className="
                            h-[48px]
                            px-5
                            inline-flex items-center justify-center
                            bg-neutral-100
                            text-black
                            rounded-xl
                            cursor-pointer
                            font-semibold
                            hover:bg-neutral-300
                            transition-colors
                          "
                        >
                          Valitse kuva

                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null

                              setBlocks(prev =>
                                prev.map(item =>
                                  item.id === block.id && item.type === 'image'
                                    ? { ...item, file }
                                    : item
                                )
                              )
                            }}
                          />
                        </label>

                        <p className="text-sm text-gray-400 text-center">
                          Ei valittua kuvatiedostoa
                        </p>
                      </>
  )}
</div>
                                                )}
                                              </div>
                                            ))}
                  </div>

                  <div className="border-t border-neutral-400 pt-4 mt-3.5">
                  <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCreateFaq}
                      className="
                        h-[52px]
                        w-full
                        sm:max-w-[220px]
                        sm:w-auto
                        inline-flex justify-center items-center
                        bg-neutral-100 text-black
                        rounded-full px-6
                        text-xl font-semibold
                        hover:bg-neutral-300
                        transition-colors
                      "
                    >
                      Lisää kysymys
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setQuestion('')
                        setBlocks([])
                      }}
                      className="
                        h-[52px]
                        w-full
                        sm:max-w-[220px]
                        sm:w-auto
                        inline-flex justify-center items-center
                        bg-red-600 hover:bg-red-700 text-white
                        rounded-full px-5
                        text-xl font-semibold
                        transition-colors
                      "
                    >
                      Peruuta
                    </button>
                    </div>
                    </div>
                  </div>
                            )}
              </div>

              <div className="bg-neutral-900 rounded-lg p-3">
                <button
                  type="button"
                  onClick={() => setBrowseFaqOpen(!browseFaqOpen)}
                  className="w-full flex items-center justify-between gap-3
                  bg-neutral-800 hover:bg-neutral-700 border border-neutral-700
                  rounded-md px-4 py-3 text-left transition-colors px-4 py-3 min-h-[58px]"
                >
                    <span className="flex items-center gap-3 font-semibold">
                    <Pen className="w-6 h-6 shrink-0" />
                      Selaa ja muokkaa kysymyksiä
                      </span>

                  <span className={`transition-transform duration-200 ${
                    browseFaqOpen ? 'rotate-180' : ''
                  }`}>
                    ▼
                  </span>
                </button>

                {browseFaqOpen && (
                <div className="space-y-3 mt-3 pl-3 border-l border-neutral-700">

                {visibleFaqs.length === 0 ? (
                <div className="ml-4 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-6 text-center text-gray-400 italic">
                  Ei näytettäviä kysymyksiä
                </div>
              ) : (
                visibleFaqs.map((faq) => (
                <div key={faq._id}>
                  <button
                  type="button"
                  onClick={() =>
                setOpenFaqId(
                  openFaqId === faq._id ? null : faq._id ?? null
                )
              }
              className="
              w-full flex items-center justify-between gap-3
              ml-4 max-w-[96%]
              bg-neutral-800 hover:bg-neutral-600
              border border-neutral-600
              rounded-xl
              px-4 py-3
              text-left
              transition-colors
              shadow-sm
              "
            >
              <span className="font-semibold">
                {faq.question}
              </span>

              <span
                className={`transition-transform duration-200 ${
                  openFaqId === faq._id ? 'rotate-180' : ''
                }`}
              >
                ▼
              </span>
            </button>

            {openFaqId === faq._id && (
              <div className="
                    space-y-3
                    mt-2 ml-8
                    bg-neutral-800
                    border border-neutral-700
                    rounded-xl
                    p-4
                    shadow-inner
                    ">
                {editingId === faq._id ? (
                  <>
                   <p className="font-semibold text-gray-200">
                      Muokkaa kysymystä:
                    </p>

                    <input
                      className="
                      w-full
                      bg-neutral-700
                      border border-neutral-600
                      rounded-xl
                      px-4 py-3
                      text-gray-100
                      placeholder:text-gray-400
                      "
                      value={editQuestion}
                      onChange={(e) => setEditQuestion(e.target.value)}
                    />


                   <p className="font-semibold text-gray-200">
                      Palautteen rakenne:
                    </p>

                    <div className="flex flex-wrap gap-3 mt-2">
                      <button
                        type="button"
                        onClick={addEditTextBlock}
                        className="
                          bg-neutral-700
                          border border-neutral-600
                          rounded-xl
                          px-5 py-3
                          text-gray-100
                          hover:bg-neutral-600
                          transition-colors
                        "
                      >
                        Lisää tekstiosio
                      </button>

                      <button
                        type="button"
                        onClick={addEditImageBlock}
                        className="
                          bg-neutral-700
                          border border-neutral-600
                          rounded-xl
                          px-5 py-3
                          text-gray-100
                          hover:bg-neutral-600
                          transition-colors
                        "
                      >
                        Lisää kuvaosio
                      </button>
                    </div>

                      <div className="space-y-3">
                        {editBlocks.map((block, index) => (
                          <div
                            key={block.id}
                            className="bg-neutral-700 border border-neutral-600 rounded-xl p-3 space-y-2"
                          >
                            <div className="flex gap-2 items-center">


                          <div className="flex items-center justify-between gap-3">
                          <div className="grid grid-cols-3 items-center">
                            <p className="font-semibold text-gray-200">
                              {block.type === 'text'
                                ? `Tekstiosio ${index + 1}`
                                : `Kuvaosio ${index + 1}`}
                            </p>

                            <div className="flex justify-center items-center gap-2">
                              <span className="text-sm text-gray-400">
                                Vaihda paikkaa
                              </span>

                              <button
                                type="button"
                                onClick={() => moveEditBlock(block.id, -1)}
                                disabled={index === 0}
                                className="text-gray-300 hover:text-white disabled:opacity-30"
                              >
                                ↑
                              </button>

                              <button
                                type="button"
                                onClick={() => moveEditBlock(block.id, 1)}
                                disabled={index === editBlocks.length - 1}
                                className="text-gray-300 hover:text-white disabled:opacity-30"
                              >
                                ↓
                              </button>
                            </div>

                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeEditBlock(block.id)}
                                className="text-sm text-red-400 hover:text-red-300 px-15"
                              >
                                Poista osio
                              </button>
                            </div>
                          </div>
                          </div>
                        </div>

                            {block.type === 'text' ? (
                              <textarea
                                className="
                                  w-full
                                  bg-neutral-800
                                  border border-neutral-600
                                  rounded-xl
                                  px-4 py-3
                                  text-gray-100
                                  min-h-[120px]
                                  resize-none
                                "
                                value={block.content}
                                onChange={(e) => {
                                  setEditBlocks(prev =>
                                    prev.map(item =>
                                      item.id === block.id && item.type === 'text'
                                        ? { ...item, content: e.target.value }
                                        : item
                                    )
                                  )
                                }}
                              />
                            ) : (
                             <div className="flex flex-col items-center gap-3">
  {(block.file || block.imageUrl) && (
    <img
      src={
        block.file
          ? URL.createObjectURL(block.file)
          : `${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}${block.imageUrl}`
      }
      alt="Esikatselu"
      className="
        rounded-xl
        border border-neutral-600
        max-w-full
        max-h-[300px]
      "
    />
  )}

  {block.file || block.imageUrl ? (
    <>
      <div className="flex flex-wrap justify-center gap-3">
        <label
          className="
            h-[48px]
            px-5
            inline-flex items-center justify-center
            bg-neutral-100
            text-black
            rounded-xl
            cursor-pointer
            font-semibold
            hover:bg-neutral-300
            transition-colors
          "
        >
          Valitse toinen kuva

          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null

              setEditBlocks(prev =>
                prev.map(item =>
                  item.id === block.id && item.type === 'image'
                    ? { ...item, file, imageUrl: undefined }
                    : item
                )
              )
            }}
          />
        </label>

        <button
          type="button"
          onClick={() => {
            setEditBlocks(prev =>
              prev.map(item =>
                item.id === block.id && item.type === 'image'
                  ? { ...item, file: null, imageUrl: undefined }
                  : item
                            )
                          )
                        }}
                        className="
                          h-[48px]
                          px-5
                          bg-red-600
                          hover:bg-red-700
                          text-white
                          rounded-xl
                          transition-colors
                        "
                      >
                        Poista kuva
                      </button>
                    </div>

                    <p className="text-sm text-gray-400 text-center">
                      {block.file ? block.file.name : 'Nykyinen kuva säilyy'}
                    </p>
                  </>
                ) : (
                  <>
                    <label
                      className="
                        h-[48px]
                        px-5
                        inline-flex items-center justify-center
                        bg-neutral-100
                        text-black
                        rounded-xl
                        cursor-pointer
                        font-semibold
                        hover:bg-neutral-300
                        transition-colors
                      "
                    >
                      Valitse kuva

                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null

                          setEditBlocks(prev =>
                            prev.map(item =>
                              item.id === block.id && item.type === 'image'
                                ? { ...item, file }
                                : item
                            )
                          )
                        }}
                      />
                    </label>

                    <p className="text-sm text-gray-400 text-center">
                      Ei valittua kuvatiedostoa
                    </p>
                  </>
                )}
              </div>
                            )}
                          </div>
                        ))}
                      </div>


                   <div className="flex flex-col sm:flex-row justify-center gap-3 mt-5 w-full">
                    <button
                      type="button"
                      onClick={handleUpdateFaq}
                      className="
                        w-full sm:w-auto
                        bg-neutral-100 text-black
                        rounded-full px-5 py-3
                      "
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
                      className="
                        w-full sm:w-auto
                        bg-red-600 hover:bg-red-700 text-white
                        rounded-full px-5 py-3
                      "
                    >
                      Peruuta
                    </button>
                  </div>

                      </>
                    ) : (
                      <>
                   <div className="bg-neutral-700 border border-neutral-600 rounded-xl px-4 py-3 text-gray-200 space-y-3">
                    {(faq.blocks ?? []).map((block, index) => {
                          if (block.type === 'text') {
                            return (
                              <div key={index}>
                                {renderWithLinks(block.content ?? '')}
                              </div>
                            )
                          }

                          return (
                            <img
                              key={index}
                              src={`${
                                import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
                              }${block.imageUrl}`}
                              className="rounded-xl border border-neutral-600 max-w-full"
                            />
                          )
                        })}
                      </div>
                    <div className="space-y-2">
                      <div className="flex gap-3">
                        <button onClick={() => startEditFaq(faq)}>
                          Muokkaa
                        </button>

                        <button
                          onClick={() =>
                            faq._id && handleDeleteFaq(faq._id)
                          }
                        >
                          Poista
                        </button>
                      </div>

                      <p className="text-sm text-gray-400">
                        {faq.updatedAt &&
                        faq.createdAt &&
                        faq.updatedAt !== faq.createdAt
                          ? `Päivitetty: ${new Date(
                              faq.updatedAt
                            ).toLocaleDateString('fi-FI')}`
                          : faq.createdAt
                            ? `Lisätty: ${new Date(
                                faq.createdAt
                              ).toLocaleDateString('fi-FI')}`
                            : 'ei tiedossa'}
                      </p>
                    </div>
                                        </>
                  )}
                </div>
              )}
            </div>
            ))
        )}
        </div>
            )}
    </div>
  </div>
    </div>
  )
}
