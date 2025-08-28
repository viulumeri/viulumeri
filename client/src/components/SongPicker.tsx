import { useMemo, useState } from 'react'
import { useSongsList } from '../hooks/useSongs'
import type { SongListItem } from '../../../shared/types'

type Props = {
  value: string[]
  onChange: (ids: string[]) => void
  placeholder?: string
  disabled?: boolean
}

export const SongPicker = ({
  value,
  onChange,
  placeholder = 'Etsi…',
  disabled
}: Props) => {
  const { data, isPending, isError } = useSongsList()
  const [query, setQuery] = useState('')

  const songs: SongListItem[] = data ?? []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return songs
    return songs.filter(
      s =>
        s.title.toLowerCase().includes(q) ||
        (s.metadata?.composer ?? '').toLowerCase().includes(q)
    )
  }, [songs, query])

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter(x => x !== id))
    } else {
      onChange([...value, id])
    }
  }

  if (isPending) return <div>Ladataan kappaleita…</div>
  if (isError) return <div>Virhe ladattaessa kappaleita</div>

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{ width: '100%', marginBottom: 8 }}
      />
      <div
        style={{
          maxHeight: 220,
          overflow: 'auto',
          borderTop: '1px solid #eee',
          paddingTop: 8
        }}
      >
        {filtered.map(song => {
          const checked = value.includes(song.id)
          return (
            <label
              key={song.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 0'
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(song.id)}
                disabled={disabled}
              />
              <span>
                {song.title}
                {song.metadata?.composer ? ` — ${song.metadata.composer}` : ''}
              </span>
            </label>
          )
        })}
        {!filtered.length && <div>Ei tuloksia</div>}
      </div>
    </div>
  )
}
