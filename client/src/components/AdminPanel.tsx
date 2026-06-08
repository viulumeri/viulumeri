import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Banana, CirclePlus, FileQuestionMark, Pen, CircleEllipsis } from 'lucide-react'
import { useAdminSummary, useAdminTeachers, useAdminStudents, useDeleteAdminTeacher, useDeleteAdminStudent, useImpersonateAdminUser } from '../hooks/useAdmin'
import { DropdownSearchbar } from './DropdownSearchbar'
import { useNotification } from '../hooks/useNotification'
import type { Teacher, Student } from '../services/admin'
import { faqService, type FAQ } from '../services/faq'
import { renderWithLinks } from "../utils/renderLinks"


interface SearchResultUser {
  id: string
  name: string
  email: string
  role: 'teacher' | 'student'
}

export const AdminPanel = () => {

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [createFaqOpen, setCreateFaqOpen] = useState(false)
  const [browseFaqOpen, setBrowseFaqOpen] = useState(false)

  const [openFaqId, setOpenFaqId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQuestion, setEditQuestion] = useState('')
  const [editAnswer, setEditAnswer] = useState('')

  const { data: teachersData, error: teachersError } = useAdminTeachers()
  const { data: studentsData, error: studentsError } = useAdminStudents()

  const [searchUserInput, setSearchUserInput] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResultUser[]>([])
  const [selectedUser, setSelectedUser] = useState<Teacher | Student | null>(null)
  const [profileExpanded, setProfileExpanded] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null)

  const { showSuccess, showError } = useNotification()

  const deleteTeacher = useDeleteAdminTeacher({
    onSuccess: () => {
      setSelectedUser(null)
      setDeletingId(null)
      showSuccess('Käyttäjä poistettu onnistuneesti')
    },
    onError: (error) => {
      setDeletingId(null)
      showError(`Virhe käyttäjän poistamisessa: ${error.message}`)
    }
  })

  const deleteStudent = useDeleteAdminStudent({
    onSuccess: () => {
      setSelectedUser(null)
      setDeletingId(null)
      showSuccess('Käyttäjä poistettu onnistuneesti')
    },
    onError: (error) => {
      setDeletingId(null)
      showError(`Virhe käyttäjän poistamisessa: ${error.message}`)
    }
  })

  const impersonateUser = useImpersonateAdminUser({
    onSuccess: () => {
      showSuccess('Kirjaudutaan käyttäjänä sisään...')
      window.location.href = '/'
    },
    onError: (error) => {
      setImpersonatingId(null)
      showError(`Virhe käyttäjän impersonoinnissa: ${error.message}`)
    }
  })

  const teachers = teachersData?.teachers ?? []
  const students = studentsData?.students ?? []
  const error = teachersError || studentsError ? 'Failed to load admin data' : null

  const handleSearchUserInputChange = (value: string) => {
    setSearchUserInput(value)
    setSelectedUser(null)
    setActionsOpen(false)
    setProfileExpanded(false)

    const normalizedValue = value.toLowerCase()
    const teacherMatches = teachers
      .filter((teacher) =>
        teacher.name.toLowerCase().includes(normalizedValue) ||
        teacher.email.toLowerCase().includes(normalizedValue)
      )
      .map((teacher) => ({
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        role: 'teacher' as const
      }))

    const studentMatches = students
      .filter((student) =>
        student.name.toLowerCase().includes(normalizedValue) ||
        student.email.toLowerCase().includes(normalizedValue)
      )
      .map((student) => ({
        id: student.id,
        name: student.name,
        email: student.email,
        role: 'student' as const
      }))

    setSearchResults([...teacherMatches, ...studentMatches])
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

  const handleResultSelect = (user: SearchResultUser) => {
    const fullUserData = teachers.find((t) => t.id === user.id) || students.find((s) => s.id === user.id)
    if (fullUserData) {
      setSelectedUser(fullUserData)
      setProfileExpanded(false)
      setActionsOpen(false)
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (searchResults.length > 0) {
      handleResultSelect(searchResults[0])
    }
  }

  const loadFaqs = async () => {
  const data = await faqService.getFaqs()
  setFaqs(data)
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
    loadFaqs()
  }, [])

const visibleFaqs = faqs
  .filter((faq) => faq.question.trim())
  .sort(
    (a, b) =>
      new Date(a.createdAt ?? 0).getTime() -
      new Date(b.createdAt ?? 0).getTime()
  )

return (
  <div className="space-y-4 p-5 pb-24">
    <div className="admin-panel">
      <h1 className="flex items-center gap-3">
        <Banana className="w-8 h-8" />
        Ylläpitopaneeli
      </h1>
      
      <Link
        to="/admin/feedback"
        className="inline-block mt-4 mb-4 button-basic"
      >
        Palautteet
      </Link>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-600 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <DropdownSearchbar
        onSearchInputChange={handleSearchUserInputChange}
        onResultSelect={handleResultSelect}
        onSubmit={handleSubmit}
        searchInput={searchUserInput}
        searchResults={searchResults}
      />

      {selectedUser && (
        <div className="relative mt-6 p-4 bg-neutral-800 rounded-lg">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-[2fr_2fr_1fr_auto] gap-4 text-neutral-400 text-sm font-semibold">
              <div>Nimi</div>
              <div>Sähköposti</div>
              <div>Rooli</div>
              <div className="text-right">Toiminnot</div>
            </div>
            <div className="grid grid-cols-[2fr_2fr_1fr_auto] gap-4 items-center py-2 border-t border-neutral-700">
              <div>{selectedUser.name}</div>
              <div>{selectedUser.email}</div>
              <div>{'studentCount' in selectedUser ? 'Opettaja' : 'Oppilas'}</div>
              <div className="relative text-right">
                <button
                  type="button"
                  onClick={() => setActionsOpen((prev) => !prev)}
                  className="inline-flex items-center justify-center p-2 rounded-full bg-neutral-700 hover:bg-neutral-600"
                >
                  <CircleEllipsis />
                </button>
                {actionsOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-20">
                    <button
                      type="button"
                      disabled={Boolean(impersonatingId)}
                      onClick={() => {
                        if (impersonatingId) return
                        setActionsOpen(false)
                        setImpersonatingId(selectedUser.userId)
                        impersonateUser.mutate({ userId: selectedUser.userId })
                      }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {impersonatingId === selectedUser.userId ? 'Impersonoidaan...' : 'Impersonoi'}
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(deletingId)}
                      onClick={() => {
                        if (deletingId) return
                        setActionsOpen(false)
                        if (confirm(`Haluatko varmasti poistaa käyttäjän ${selectedUser.name}? Toimintoa ei voi perua.`)) {
                          setDeletingId(selectedUser.id)
                          if ('studentCount' in selectedUser) {
                            deleteTeacher.mutate(selectedUser.id)
                          } else {
                            deleteStudent.mutate(selectedUser.id)
                          }
                        }
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-rose-400 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === selectedUser.id ? 'Poistetaan...' : 'Poista käyttäjä'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-neutral-700 pt-4">
            <button
              type="button"
              onClick={() => setProfileExpanded((prev) => !prev)}
              className="inline-flex items-center gap-2 text-sm text-brand hover:text-brand-strong"
            >
              {profileExpanded ? 'Piilota profiili' : 'Laajenna profiili'}
            </button>

            {profileExpanded && (
              <div className="mt-3 space-y-2 text-sm text-neutral-200">
                {'studentCount' in selectedUser ? (
                  <>
                    <div><span className="font-semibold">Oppilaita:</span> {selectedUser.studentCount}</div>
                    <div><span className="font-semibold">Oppilaat:</span> {selectedUser.students.length}</div>
                  </>
                ) : (
                  <>
                    <div><span className="font-semibold">Opettajia:</span> {selectedUser.teacher ? 1 : 0}</div>
                    {selectedUser.teacher ? (
                      <div><span className="font-semibold">Opettaja:</span> {selectedUser.teacher.name} ({selectedUser.teacher.email})</div>
                    ) : (
                      <div>Opettajaa ei ole asetettu</div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
/*         <div className="mt-6 p-4 bg-neutral-800 rounded-lg">
          <h2 className="text-lg font-bold mb-3">{selectedUser.name}</h2>
          <div className="space-y-2">
            <p><strong>Email:</strong> {selectedUser.email}</p>
            {'studentCount' in selectedUser && (
              <>
                <p><strong>Oppilaita:</strong> {selectedUser.studentCount}</p>
                <p><strong>Oppilaiden lukumäärä:</strong> {selectedUser.students?.length || 0}</p>
                {selectedUser.students && selectedUser.students.length > 0 && (
                  <div className="mt-3">
                    <p><strong>Oppilaat:</strong></p>
                    <ul className="ml-4 space-y-1">
                      {selectedUser.students.map(student => (
                        <li key={student.id}>{student.name} ({student.email})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={() => {
                if (impersonatingId) return
                setImpersonatingId(selectedUser.id)
                impersonateUser.mutate({ userId: selectedUser.userId })
              }}
              disabled={Boolean(deletingId || impersonatingId)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {impersonatingId === selectedUser.id ? 'Impersonoidaan...' : 'Kirjaudu käyttäjänä'}
            </button>
            <button
              onClick={() => {
                if (deletingId) return
                if (confirm(`Haluatko varmasti poistaa käyttäjän ${selectedUser.name}? Toimintoa ei voi perua.`)) {
                  setDeletingId(selectedUser.id)
                  if ('studentCount' in selectedUser) {
                    deleteTeacher.mutate(selectedUser.id)
                  } else {
                    deleteStudent.mutate(selectedUser.id)
                  }
                }
              }}
              disabled={Boolean(deletingId)}
              className="inline-flex justify-center items-center gap-2 bg-neutral-100 text-black
              rounded-full px-6 py-2 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              {deletingId === selectedUser.id ? 'Poistetaan...' : 'Poista käyttäjä'}
            </button>
          </div>
        </div> */
      )}
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

                    <p className="font-semibold text-gray-200">
                      Vastaus:
                    </p>

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
                      placeholder="Kirjoita vastaus"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                    />

                <div className="flex justify-center mt-2">
                <button
                  onClick={handleCreateFaq}
                  className="inline-flex justify-center items-center gap-2
                  bg-neutral-100 text-black rounded-full px-6 py-2 text-xl"
                >
                  Lisää kysymys
                </button>
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

                    <textarea
                      className="
                      w-full
                      bg-neutral-700
                      border border-neutral-600
                      rounded-xl
                      px-4 py-3
                      text-gray-100
                      placeholder:text-gray-400
                      min-h-[120px]
                      resize-none
                      "
                      value={editAnswer}
                      onChange={(e) => setEditAnswer(e.target.value)}
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
</div>
)
}
