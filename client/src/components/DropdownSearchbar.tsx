import { useEffect, useState } from 'react'
import { Users, ScanSearch } from 'lucide-react'

interface SearchResultUser {
  id: string
  name: string
  email: string
  role: 'teacher' | 'student'
}

interface DropdownSearchbarProps {
  onSearchInputChange: (value: string) => void
  onResultSelect: (user: SearchResultUser) => void
  onSubmit: (event: React.FormEvent) => void
  searchInput: string
  searchResults: SearchResultUser[]
}

const RESULTS_PER_PAGE = 5

export const DropdownSearchbar = ({
  onSearchInputChange,
  onResultSelect,
  onSubmit,
  searchInput,
  searchResults
}: DropdownSearchbarProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [page, setPage] = useState(0)

  useEffect(() => {
    setPage(0)
    setIsOpen(searchInput.length > 0 && searchResults.length > 0)
  }, [searchInput, searchResults])

  const paginatedResults = searchResults.slice(page * RESULTS_PER_PAGE, (page + 1) * RESULTS_PER_PAGE)
  const totalPages = Math.ceil(searchResults.length / RESULTS_PER_PAGE)

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    onSearchInputChange(value)
    setIsOpen(value.length > 0 && searchResults.length > 0)
  }

  const handleResultClick = (user: SearchResultUser) => {
    onResultSelect(user)
    setIsOpen(false)
  }

  const handlePreviousPage = () => {
    setPage((prev) => Math.max(prev - 1, 0))
  }

  const handleNextPage = () => {
    setPage((prev) => Math.min(prev + 1, totalPages - 1))
  }

  return (
    <form className="flex items-center max-w-lg mx-auto space-x-2" onSubmit={onSubmit}>
      <label className="sr-only">Etsi käyttäjiä</label>
      <div className="relative w-full">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
          <Users size={16} strokeWidth={1.5} />
        </div>
        <input
          type="text"
          className="px-3 py-2.5 bg-neutral-secondary-medium border border-default-medium rounded-base ps-10 text-heading text-sm focus:ring-brand focus:border-brand rounded-lg w-full placeholder:text-body"
          placeholder="Etsi käyttäjiä..."
          onChange={handleInputChange}
          value={searchInput}
        />
        {isOpen && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-default-medium rounded-base shadow-lg z-10 overflow-hidden">
            <div className="divide-y divide-neutral-200">
              {paginatedResults.map((user) => (
                <button
                  type="button"
                  key={user.id}
                  onClick={() => handleResultClick(user)}
                  className="w-full text-left p-3 hover:bg-neutral-100 transition-colors"
                >
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-sm text-neutral-600">{user.email}</div>
                  <div className="text-xs text-neutral-500">{user.role === 'teacher' ? 'Opettaja' : 'Oppilas'}</div>
                </button>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-2 p-2 bg-neutral-secondary-medium">
                <button
                  type="button"
                  onClick={handlePreviousPage}
                  disabled={page === 0}
                  className="px-3 py-1 text-sm rounded-md bg-white border border-neutral-300 disabled:opacity-50"
                >
                  Edellinen
                </button>
                <span className="text-sm text-neutral-600">
                  {page + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={page === totalPages - 1}
                  className="px-3 py-1 text-sm rounded-md bg-white border border-neutral-300 disabled:opacity-50"
                >
                  Seuraava
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <button
        type="submit"
        className="inline-flex items-center justify-center shrink-0 text-white bg-brand hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs rounded-base w-10 h-10 focus:outline-none"
      >
        <ScanSearch size={22} strokeWidth={1.5} />
      </button>
    </form>
  )
}