import { Fragment, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, ScanSearch, Users } from 'lucide-react'

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
  renderExpandedResult?: (user: SearchResultUser) => ReactNode
  searchInput: string
  searchResults: SearchResultUser[]
  selectedResultKey?: string | null
}

const RESULTS_PER_PAGE = 5

export const DropdownSearchbar = ({
  onSearchInputChange,
  onResultSelect,
  onSubmit,
  renderExpandedResult,
  searchInput,
  searchResults,
  selectedResultKey
}: DropdownSearchbarProps) => {
  const [page, setPage] = useState(0)

  useEffect(() => {
    setPage(0)
  }, [searchInput, searchResults])

  const paginatedResults = searchResults.slice(page * RESULTS_PER_PAGE, (page + 1) * RESULTS_PER_PAGE)
  const totalPages = Math.ceil(searchResults.length / RESULTS_PER_PAGE)

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearchInputChange(event.target.value)
  }

  const handleResultClick = (user: SearchResultUser) => {
    onResultSelect(user)
  }

  const handlePreviousPage = () => {
    setPage((prev) => Math.max(prev - 1, 0))
  }

  const handleNextPage = () => {
    setPage((prev) => Math.min(prev + 1, totalPages - 1))
  }

  return (
    <div className="mx-auto max-w-4xl space-y-3">
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
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center shrink-0 text-white bg-brand hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs rounded-base w-10 h-10 focus:outline-none"
          
        >
          <ScanSearch size={22} strokeWidth={1.5} />
        </button>
      </form>

      <div className="rounded-lg border border-neutral-700 bg-neutral-800">
        <div className="grid grid-cols-[2fr_2fr_1fr] gap-4 px-4 py-3 text-sm font-semibold text-neutral-400">
          <div>Nimi</div>
          <div>Sähköposti</div>
          <div>Rooli</div>
        </div>

        {paginatedResults.length > 0 ? (
          <div className="divide-y divide-neutral-700">
            {paginatedResults.map((user) => {
              const resultKey = `${user.role}-${user.id}`
              const isSelected = selectedResultKey === resultKey

              return (
                <Fragment key={resultKey}>
                  <button
                    type="button"
                    onClick={() => handleResultClick(user)}
                    className={`grid w-full grid-cols-[2fr_2fr_1fr] gap-4 px-4 py-3 text-left transition-colors hover:bg-neutral-700 ${isSelected ? 'bg-neutral-700' : ''}`}
                  >
                    <div className="font-semibold text-neutral-100">{user.name}</div>
                    <div className="text-sm text-neutral-300">{user.email}</div>
                    <div className="text-sm text-neutral-300">{user.role === 'teacher' ? 'Opettaja' : 'Oppilas'}</div>
                  </button>
                  {isSelected && renderExpandedResult && (
                    <div className="border-t border-neutral-700 bg-neutral-900 px-4 py-4">
                      {renderExpandedResult(user)}
                    </div>
                  )}
                </Fragment>
              )
            })}
          </div>
        ) : (
          <div className="border-t border-neutral-700 px-4 py-5 text-sm text-neutral-300">
            Ei käyttäjiä
          </div>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-neutral-700 bg-neutral-900 px-3 py-2">
          <button
            type="button"
            onClick={handlePreviousPage}
            disabled={page === 0}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 text-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Edellinen sivu"
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <span className="text-sm text-neutral-300">
            {searchResults.length > 0 ? page + 1 : 0} / {Math.max(totalPages, 1)}
          </span>
          <button
            type="button"
            onClick={handleNextPage}
            disabled={page >= totalPages - 1}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 text-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Seuraava sivu"
          >
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  )
}
