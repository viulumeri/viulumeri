import fs from 'fs/promises'
import path from 'path'

const SONG_ORDER_FILE = '.song-order.json'

export const getSongOrderPath = (musicDir: string) =>
  path.join(musicDir, SONG_ORDER_FILE)

export const readSongOrder = async (musicDir: string): Promise<string[]> => {
  try {
    const raw = await fs.readFile(getSongOrderPath(musicDir), 'utf8')
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed.filter((id): id is string => typeof id === 'string')
  } catch {
    return []
  }
}

export const writeSongOrder = async (musicDir: string, songIds: string[]) => {
  await fs.mkdir(musicDir, { recursive: true })
  const uniqueIds = Array.from(new Set(songIds))
  await fs.writeFile(
    getSongOrderPath(musicDir),
    `${JSON.stringify(uniqueIds, null, 2)}\n`,
    'utf8'
  )
}

export const sortBySongOrder = <T extends { id: string; title?: string }>(
  songs: T[],
  songOrder: string[]
) => {
  const orderIndex = new Map(songOrder.map((id, index) => [id, index]))

  return [...songs].sort((left, right) => {
    const leftIndex = orderIndex.get(left.id)
    const rightIndex = orderIndex.get(right.id)

    if (leftIndex !== undefined && rightIndex !== undefined) {
      return leftIndex - rightIndex
    }
    if (leftIndex !== undefined) return -1
    if (rightIndex !== undefined) return 1

    return left.id.localeCompare(right.id, 'fi')
  })
}
