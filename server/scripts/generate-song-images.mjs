import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import sharp from 'sharp'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const SERVER_ROOT = path.resolve(SCRIPT_DIR, '..')
const WORKSPACE_ROOT = path.resolve(SERVER_ROOT, '..')

const loadEnv = () => {
  dotenv.config({ path: path.join(SERVER_ROOT, '.env.local'), quiet: true })
  dotenv.config({ path: path.join(SERVER_ROOT, '.env'), quiet: true })
  dotenv.config({ path: path.join(WORKSPACE_ROOT, '.env.local'), quiet: true })
  dotenv.config({ path: path.join(WORKSPACE_ROOT, '.env'), quiet: true })
}

loadEnv()

const MUSIC_DIR = path.resolve(
  process.argv[2] || process.env.MUSIC_DIR || '/var/www/audio'
)

const VARIANTS = {
  list: { width: 112, height: 112 },
  card: { width: 720, height: 720 },
  hero: { width: 1920, height: 1080 }
}

const SOURCE_CANDIDATES = [
  'cover.jpg',
  'cover.jpeg',
  'cover.png',
  'cover.webp',
  'cover.avif',
  'image.jpg',
  'image.jpeg',
  'image.png',
  'image.webp',
  'image.avif',
  path.join('images', 'original.jpg'),
  path.join('images', 'original.jpeg'),
  path.join('images', 'original.png'),
  path.join('images', 'original.webp'),
  path.join('images', 'original.avif')
]

const exists = async filePath => {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

const resolveSourceImage = async songDir => {
  for (const candidate of SOURCE_CANDIDATES) {
    const fullPath = path.join(songDir, candidate)
    if (await exists(fullPath)) {
      return fullPath
    }
  }
  return null
}

const generateVariants = async (songId, songDir) => {
  const metadataPath = path.join(songDir, 'metadata.json')
  if (!(await exists(metadataPath))) {
    return { songId, status: 'skipped', reason: 'missing metadata.json' }
  }

  const sourceImage = await resolveSourceImage(songDir)
  if (!sourceImage) {
    return {
      songId,
      status: 'skipped',
      reason: 'no local source image found'
    }
  }

  const outputDir = path.join(songDir, 'images')
  await fs.mkdir(outputDir, { recursive: true })

  for (const [variant, size] of Object.entries(VARIANTS)) {
    const targetPath = path.join(outputDir, `${variant}.webp`)
    await sharp(sourceImage)
      .resize(size.width, size.height, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 82 })
      .toFile(targetPath)
  }

  return { songId, status: 'generated', sourceImage }
}

const run = async () => {
  console.log(`Using MUSIC_DIR: ${MUSIC_DIR}`)

  const entries = await fs.readdir(MUSIC_DIR, { withFileTypes: true })
  const songDirs = entries.filter(entry => entry.isDirectory()).map(entry => entry.name)

  const results = []
  for (const songId of songDirs) {
    const songDir = path.join(MUSIC_DIR, songId)
    const result = await generateVariants(songId, songDir)
    results.push(result)
  }

  console.log(`Processed ${results.length} song folders in ${MUSIC_DIR}`)
  for (const result of results) {
    if (result.status === 'generated') {
      console.log(`- ${result.songId}: generated from ${result.sourceImage}`)
    } else {
      console.log(`- ${result.songId}: skipped (${result.reason})`)
    }
  }
}

run().catch(error => {
  console.error('Failed to generate song image variants:', error)
  process.exit(1)
})
