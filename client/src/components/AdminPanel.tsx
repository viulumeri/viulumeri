import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Banana, CirclePlus, FileQuestionMark, Pen, Trash2 } from 'lucide-react'
import { useAdminSummary, useAdminTeachers, useAdminStudents, useDeleteAdminTeacher, useDeleteAdminStudent, useImpersonateAdminUser } from '../hooks/useAdmin'
import { DropdownSearchbar } from './DropdownSearchbar'
import { useNotification } from '../hooks/useNotification'
import type { Teacher, Student } from '../services/admin'
import { faqService, type FAQ } from '../services/faq'
import { renderWithLinks } from "../utils/renderLinks"


interface User {
  id: string
  name: string
  email: string
}

export const AdminPanel = () => {

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [editImageInputKey, setEditImageInputKey] = useState(0)
  const [imageInputKey, setImageInputKey] = useState(0)
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [createFaqOpen, setCreateFaqOpen] = useState(false)
  const [browseFaqOpen, setBrowseFaqOpen] = useState(false)

  const [openFaqId, setOpenFaqId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQuestion, setEditQuestion] = useState('')
  const [editAnswer, setEditAnswer] = useState('')
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [removeEditImage, setRemoveEditImage] = useState(false)


  const { data: summaryData } = useAdminSummary()
  const { data: teachersData, error: teachersError } = useAdminTeachers()
  const { data: studentsData, error: studentsError } = useAdminStudents()

  const [searchUserInput, setSearchUserInput] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<Teacher | Student | null>(null)
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
    setSearchResults([...teachers, ...students].filter(user =>
      user.name.toLowerCase().includes(value.toLowerCase()) ||
      user.email.toLowerCase().includes(value.toLowerCase())
    ))
  }

const handleCreateFaq = async () => {
  try {
    const formData = new FormData()

    formData.append('question', question)
    formData.append('answer', answer)
    formData.append('order', '1')

    if (imageFile) {
      formData.append('image', imageFile)
    }

    await faqService.createFaq(formData)

    setQuestion('')
    setAnswer('')
    setImageFile(null)

    showSuccess('Kysymys lisätty onnistuneesti!')

    await loadFaqs()
  } catch (error) {
    console.error(error)
    showError('FAQ:n lisääminen epäonnistui')
  }
}
  const handleResultSelect = (user: User) => {
    const fullUserData = teachers.find(t => t.id === user.id) || students.find(s => s.id === user.id)
    if (fullUserData) {
      setSelectedUser(fullUserData)
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
  setEditImageFile(null)
  setRemoveEditImage(false)

}

  const handleUpdateFaq = async () => {
  if (!editingId) return

  const formData = new FormData()

  formData.append('question', editQuestion)
  formData.append('answer', editAnswer)

  if (editImageFile) {
    formData.append('image', editImageFile)
  }

  if (removeEditImage) {
    formData.append('removeImage', 'true')
  }

  await faqService.updateFaq(editingId, formData)

  setEditingId(null)
  setEditQuestion('')
  setEditAnswer('')
  setEditImageFile(null)
  setRemoveEditImage(false)

  showSuccess('Muutokset tallennettu onnistuneesti!')

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
       <div className="bg-neutral-900 rounded-lg p-2 -mb-4">
      <div className="space-y-2 text-gray-300">
          <p>

          </p>

      <p>Tämä on superkäyttäjän hallintapaneelin kanta.
        Tässä voidaan myöhemmin näyttää järjestelmän tilanne ja hallintatoiminnot..</p>
    </div>
      {error && <div className="error">{error}</div>}

      {summaryData ? (
        <div className="admin-summary">
          <div>Opettajia: {summaryData.teacherCount}</div>
          <div>Oppilaita: {summaryData.studentCount}</div>
          <div>Tehtäviä: {summaryData.homeworkCount}</div>
        </div>
      ) : (
        !error && <div>Ladataan yhteenvedon tietoja...</div>
      )}

      </div>


      <Link
        to="/admin/feedback"
        className="inline-block mt-4 mb-4 button-basic"
      >
        Palautteet
      </Link>

      <DropdownSearchbar
        onSearchInputChange={handleSearchUserInputChange}
        onResultSelect={handleResultSelect}
        onSubmit={handleSubmit}
        searchInput={searchUserInput}
        searchResults={searchResults}
      />

      {selectedUser && (
        <div className="mt-6 p-4 bg-neutral-800 rounded-lg">
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
        </div>
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
                    <p className="font-semibold text-gray-200 -mt-1.5">
                          Liitä kysymykseen kuva:
                        </p>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <label
                    className="
                      shrink-0
                      h-[52px]
                      px-6
                      flex items-center justify-center
                      bg-neutral-100 text-black
                      border border-neutral-600
                      rounded-xl
                      cursor-pointer
                      hover:bg-neutral-300
                      transition-colors
                    "
                  >
                    Valitse

                    <input
                    key={imageInputKey}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      setImageFile(file ?? null)
                    }}
                  />
                  </label>

                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div
                      className="
                        h-[52px]
                        flex items-center justify-center
                        bg-neutral-700
                        border border-neutral-600
                        rounded-xl
                        px-4
                        text-gray-300
                      "
                    >
                      <span className="block w-full overflow-hidden text-ellipsis
                      whitespace-nowrap text-center">
                        {imageFile ? imageFile.name : 'Ei valittua kuvatiedostoa'}
                      </span>
                    </div>

                    {imageFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null)
                          setImageInputKey((key) => key + 1)
                        }}
                        className="ml-2 text-left text-sm text-red-400 hover:text-red-300"
                      >
                        ✕ Poista valittu tiedosto
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3 mt-1.5 w-full">
                  <button
                      onClick={handleCreateFaq}
                     className="
                      h-[52px]
                      w-full
                      sm:max-w-[220px]
                      sm:w-auto
                      inline-flex justify-center items-center
                      bg-neutral-100 text-black
                      rounded-full px-6 py-2 text-xl
                      "
                    >
                      Lisää kysymys
                    </button>
                    <button
                          onClick={() => {
                          setQuestion('')
                          setAnswer('')
                          setImageFile(null)
                          setImageInputKey((key) => key + 1)
                        }}
                          className="
                          h-[52px]
                          w-full
                          sm:max-w-[220px]
                          sm:w-auto
                          inline-flex justify-center items-center
                          bg-red-600 hover:bg-red-700 text-white
                          rounded-full px-5 py-2 text-xl
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
                      Muokkaa vastausta:
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
                      min-h-[120px]
                      resize-none
                      "
                      value={editAnswer}
                      onChange={(e) => setEditAnswer(e.target.value)}
                    />

                    <p className="font-semibold text-gray-200 -mt-1.5">
                      Lisää, vaihda tai poista kuva:
                    </p>
                    {faq.imageUrl && !editImageFile && !removeEditImage && (
                        <img
                          src={`${
                            import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
                          }${faq.imageUrl}`}
                          alt="Nykyinen kuva"
                          className="mt-2 mb-3 rounded-xl border border-neutral-600 max-w-full max-h-[300px]"
                        />
                      )}

                  <div className="flex flex-col sm:flex-row gap-2 -mt-1 w-full">
                      <label
                        className="
                          shrink-0
                          h-[52px]
                          px-6
                          flex items-center justify-center
                          bg-neutral-100 text-black
                          border border-neutral-600
                          rounded-xl
                          cursor-pointer
                        "
                      >
                        Valitse

                        <input
                          key={editImageInputKey}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            setEditImageFile(file ?? null)
                            setRemoveEditImage(false)
                          }}
                        />
                      </label>

                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div
                          className="
                            w-full
                            h-[52px]
                            flex items-center justify-center
                            bg-neutral-700
                            border border-neutral-600
                            rounded-xl
                            px-4
                            text-gray-300
                          "
                        >
                          <span className="block w-full overflow-hidden
                          text-ellipsis whitespace-nowrap text-center">
                            {editImageFile
                              ? editImageFile.name
                              : 'Ei valittua kuvatiedostoa'}
                          </span>
                        </div>

                        {editImageFile && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditImageFile(null)
                                setEditImageInputKey((key) => key + 1)
                              }}
                              className="ml-2 text-left text-sm text-red-400 hover:text-red-300"
                            >
                              ✕ Poista valittu kuva
                            </button>
                          )}
                      </div>
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
                        setRemoveEditImage(true)
                        setEditImageFile(null)
                        setEditImageInputKey((key) => key + 1)
                        showSuccess('Kuva merkitty poistettavaksi. Tallenna muutokset.')
                      }}
                      className="
                        w-full sm:w-auto
                        bg-neutral-700 border border-neutral-600
                        text-gray-200 rounded-full px-5 py-3
                      "
                    >
                      Poista edellinen kuva
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null)
                        setEditQuestion('')
                        setEditAnswer('')
                        setEditImageFile(null)
                        setRemoveEditImage(false)
                        setEditImageInputKey((key) => key + 1)
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
                    <div className="bg-neutral-700 border border-neutral-600 rounded-xl px-4 py-3 text-gray-200">
                    {renderWithLinks(faq.answer)}

                   {faq.imageUrl && (
                      <img
                        src={`${
                        import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
                        }${faq.imageUrl}`}
                        className="mt-3 rounded-xl border border-neutral-600 max-w-full"
                      />
                    )}
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
