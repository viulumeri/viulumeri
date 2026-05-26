import { useState } from 'react'
import { Users, ScanSearch } from 'lucide-react'
import type { Teacher, Student } from '../services/admin'

interface User {
  id: string
  name: string
  email: string
}

interface DropdownSearchbarProps {
  onSearchInputChange: (value: string) => void
  onResultSelect: (user: User) => void
  onSubmit: (event: React.FormEvent) => void
  searchInput: string
  searchResults: User[]
}

export const DropdownSearchbar = ({
  onSearchInputChange,
  onResultSelect,
  onSubmit,
  searchInput,
  searchResults
}: DropdownSearchbarProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    onSearchInputChange(value)
    setIsOpen(value.length > 0 && searchResults.length > 0)
  }

  const handleResultClick = (user: User) => {
    onResultSelect(user)
    setIsOpen(false)
  }

  return (
    <form className="flex items-center max-w-sm mx-auto space-x-2" onSubmit={onSubmit}>   
      <label>Search</label>
      <div className="relative w-full">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
          <Users size={12} strokeWidth={1.5} />
        </div>
        <input 
          type="text"
          className="px-3 py-2.5 bg-neutral-secondary-medium border border-default-medium rounded-base ps-9 text-heading text-sm focus:ring-brand focus:border-brand rounded-lg w-full placeholder:text-body" 
          placeholder="Etsi käyttäjiä..." 
          onChange={handleInputChange}
          value={searchInput}
        />
        {isOpen && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-default-medium rounded-base shadow-lg z-10">
            {searchResults.map(user => (
              <div 
                key={user.id} 
                onClick={() => handleResultClick(user)}
                className="p-2 bg-black hover:bg-black-100 cursor-pointer transition-colors"
              >
                {user.name} ({user.email})
              </div>
            ))}
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