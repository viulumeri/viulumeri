import { BookOpen, ListMusic } from 'lucide-react'

export type ToggleSwitchValue = 'homework' | 'songs'
export type ToggleSwitchProps = {
  value: ToggleSwitchValue
  onChange: (next: ToggleSwitchValue) => void
}

export default function ToggleSwitch({ value, onChange }: ToggleSwitchProps) {
  const isSongs = value === 'songs'
  return (
    <div className="relative w-17 h-9 bg-gray-800 rounded-full flex items-center px-1 gap-1">
      <div
        className={`absolute top-0 left-0 w-9 h-9 rounded-full bg-red-900 transition-all duration-300 ${
          isSongs ? 'translate-x-8' : 'translate-x-0'
        }`}
      />
      <button
        onClick={() => onChange('homework')}
        className="z-10 w-9 h-9 flex items-center justify-center"
      >
        <BookOpen color="white" size={20} />
      </button>
      <button
        onClick={() => onChange('songs')}
        className="z-10 w-9 h-9 flex items-center justify-center"
      >
        <ListMusic color="white" size={20} />
      </button>
    </div>
  )
}
