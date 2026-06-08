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
    <div className="space-y-4 p-5 pb-24">
      <h1 className="flex items-center gap-3">
        <FileQuestionMark className="w-8 h-8" />
        Usein kysytyt kysymykset
      </h1>

      <div className="bg-neutral-900 rounded-lg p-4 space-y-4">
        <div className="bg-neutral-900 rounded-lg p-3 mb-4">
          <button
            type="button"
            onClick={() => setCreateFaqOpen(!createFaqOpen)}
            className="w-full flex items-center justify-between gap-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-md px-4 py-3 text-left transition-colors min-h-[58px]"
          >
            <span className="flex items-center gap-3 font-semibold">
              <CirclePlus className="w-6 h-6 shrink-0" />
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
            <div className="space-y-2 mt-3 pl-3 border-l border-neutral-700">
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
                  Lisaa kysymys
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-neutral-900 rounded-lg p-3">
          <button
            type="button"
            onClick={() => setBrowseFaqOpen(!browseFaqOpen)}
            className="w-full flex items-center justify-between gap-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-md px-4 py-3 text-left transition-colors min-h-[58px]"
          >
            <span className="flex items-center gap-3 font-semibold">
              <Pen className="w-6 h-6 shrink-0" />
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
            <div className="space-y-3 mt-3 pl-3 border-l border-neutral-700">
              {visibleFaqs.length === 0 ? (
                <div className="ml-4 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-6 text-center text-gray-400 italic">
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
                      className="w-full flex items-center justify-between gap-3 ml-4 max-w-[96%] bg-neutral-800 hover:bg-neutral-600 border border-neutral-600 rounded-xl px-4 py-3 text-left transition-colors shadow-sm"
                    >
                      <span className="font-semibold">{faq.question}</span>

                      <span
                        className={`transition-transform duration-200 ${
                          openFaqId === faq._id ? 'rotate-180' : ''
                        }`}
                      >
                        ▼
                      </span>
                    </button>

                    {openFaqId === faq._id && (
                      <div className="space-y-3 mt-2 ml-8 bg-neutral-800 border border-neutral-700 rounded-xl p-4 shadow-inner">
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

                            <div className="flex gap-3">
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
                              <div className="flex gap-3">
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
                                    ? `Lisatty: ${new Date(
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
