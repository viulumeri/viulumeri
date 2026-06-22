import { useEffect, useState } from 'react'
import { CirclePlus, FileQuestionMark, Pen } from 'lucide-react'
import { useNotification } from '../hooks/useNotification'
import { faqService, type FAQ } from '../services/faq'
import { renderWithLinks } from '../utils/renderLinks'

export const AdminFaqPage = () => {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [createFaqOpen, setCreateFaqOpen] = useState(false)
  const [browseFaqOpen, setBrowseFaqOpen] = useState(false)
  const [openFaqId, setOpenFaqId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQuestion, setEditQuestion] = useState('')
  const [editAnswer, setEditAnswer] = useState('')

  const { showSuccess } = useNotification()

  const loadFaqs = async () => {
    const data = await faqService.getFaqs()
    setFaqs(data)
  }

  const handleCreateFaq = async () => {
    await faqService.createFaq({
      question,
      answer,
      order: 1
    })

    setQuestion('')
    setAnswer('')
    showSuccess('Kysymys lisätty onnistuneesti!')
    await loadFaqs()
  }

  const handleDeleteFaq = async (id: string) => {
    await faqService.deleteFaq(id)
    showSuccess('Kysymys poistettu onnistuneesti!')
    await loadFaqs()
  }

  const startEditFaq = (faq: FAQ) => {
    setEditingId(faq._id ?? null)
    setEditQuestion(faq.question)
    setEditAnswer(faq.answer)
  }

  const handleUpdateFaq = async () => {
    if (!editingId) return

    await faqService.updateFaq(editingId, {
      question: editQuestion,
      answer: editAnswer
    })

    setEditingId(null)
    setEditQuestion('')
    setEditAnswer('')
    showSuccess('Muutokset tallennettu!')
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
    <div className="admin-page">
      <h1 className="admin-page-title">
        <FileQuestionMark className="admin-page-title-icon" />
        Usein kysytyt kysymykset
      </h1>

      <div className="space-y-4">
        <div className="rounded-lg bg-neutral-900">
          <button
            type="button"
            onClick={() => setCreateFaqOpen(!createFaqOpen)}
            className="flex min-h-[58px] w-full items-center justify-between gap-3 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-3 text-left transition-colors hover:bg-neutral-700 sm:px-4"
          >
            <span className="flex min-w-0 items-center gap-3 font-semibold">
              <CirclePlus className="h-6 w-6 shrink-0" />
              Lisää uusi kysymys
            </span>

            <span
              className={`flex items-center justify-center text-gray-300 text-lg font-bold transition-transform duration-200 ${
                createFaqOpen ? 'rotate-180' : ''
              }`}
            >
              ▼
            </span>
          </button>

          {createFaqOpen && (
            <div className="mt-3 space-y-2 border-l border-neutral-700 pl-3">
              <p className="font-semibold text-gray-200">Kysymys:</p>

              <input
                className="w-full bg-neutral-700 border border-neutral-600 rounded-xl px-4 py-3 text-gray-100 placeholder:text-gray-400"
                placeholder="Kirjoita kysymys"
                value={question}
                onChange={e => setQuestion(e.target.value)}
              />

              <p className="font-semibold text-gray-200">Vastaus:</p>

              <textarea
                className="w-full bg-neutral-700 border border-neutral-600 rounded-xl px-4 py-3 text-gray-100 placeholder:text-gray-400 leading-relaxed min-h-[120px] resize-none"
                placeholder="Kirjoita vastaus"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
              />

              <div className="flex justify-center mt-2">
                <button
                  onClick={handleCreateFaq}
                  className="inline-flex justify-center items-center gap-2 bg-neutral-100 text-black rounded-full px-6 py-2 text-xl"
                >
                  Lisää kysymys
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-neutral-900">
          <button
            type="button"
            onClick={() => setBrowseFaqOpen(!browseFaqOpen)}
            className="flex min-h-[58px] w-full items-center justify-between gap-3 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-3 text-left transition-colors hover:bg-neutral-700 sm:px-4"
          >
            <span className="flex min-w-0 items-center gap-3 font-semibold">
              <Pen className="h-6 w-6 shrink-0" />
              Selaa ja muokkaa kysymyksiä
            </span>

            <span
              className={`transition-transform duration-200 ${
                browseFaqOpen ? 'rotate-180' : ''
              }`}
            >
              ▼
            </span>
          </button>

          {browseFaqOpen && (
            <div className="mt-3 space-y-3 border-l border-neutral-700 pl-3">
              {visibleFaqs.length === 0 ? (
                <div className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-6 text-center text-gray-400 italic sm:ml-4">
                  Ei näytettaviä kysymyksiä
                </div>
              ) : (
                visibleFaqs.map(faq => (
                  <div key={faq._id}>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFaqId(openFaqId === faq._id ? null : faq._id ?? null)
                      }
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-neutral-600 bg-neutral-800 px-3 py-3 text-left shadow-sm transition-colors hover:bg-neutral-600 sm:px-4"
                    >
                      <span className="min-w-0 break-words font-semibold">{faq.question}</span>

                      <span
                        className={`transition-transform duration-200 ${
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
                            <input
                              className="w-full bg-neutral-700 border border-neutral-600 rounded-xl px-4 py-3 text-gray-100 placeholder:text-gray-400"
                              value={editQuestion}
                              onChange={e => setEditQuestion(e.target.value)}
                            />

                            <textarea
                              className="w-full bg-neutral-700 border border-neutral-600 rounded-xl px-4 py-3 text-gray-100 placeholder:text-gray-400 min-h-[120px] resize-none"
                              value={editAnswer}
                              onChange={e => setEditAnswer(e.target.value)}
                            />

                            <div className="flex flex-wrap gap-3">
                              <button
                                onClick={handleUpdateFaq}
                                className="bg-neutral-100 text-black rounded-full px-5 py-2"
                              >
                                Tallenna
                              </button>

                              <button
                                onClick={() => {
                                  setEditingId(null)
                                  setEditQuestion('')
                                  setEditAnswer('')
                                }}
                                className="bg-neutral-700 border border-neutral-600 text-gray-200 rounded-full px-5 py-2"
                              >
                                Peruuta
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="bg-neutral-700 border border-neutral-600 rounded-xl px-4 py-3 text-gray-200">
                              {renderWithLinks(faq.answer)}
                            </div>
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-3">
                                <button onClick={() => startEditFaq(faq)}>
                                  Muokkaa
                                </button>

                                <button
                                  onClick={() => faq._id && handleDeleteFaq(faq._id)}
                                >
                                  Poista
                                </button>
                              </div>

                              <p className="text-sm text-gray-400">
                                {faq.updatedAt &&
                                faq.createdAt &&
                                faq.updatedAt !== faq.createdAt
                                  ? `Paivitetty: ${new Date(
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
