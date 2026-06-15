import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const SERVER_ROOT = path.resolve(SCRIPT_DIR, '..')
const WORKSPACE_ROOT = path.resolve(SERVER_ROOT, '..')

const loadEnv = () => {
  // Load server-local env first, then workspace-level env as fallback.
  dotenv.config({ path: path.join(SERVER_ROOT, '.env.local'), quiet: true })
  dotenv.config({ path: path.join(SERVER_ROOT, '.env'), quiet: true })
  dotenv.config({ path: path.join(WORKSPACE_ROOT, '.env.local'), quiet: true })
  dotenv.config({ path: path.join(WORKSPACE_ROOT, '.env'), quiet: true })
}

loadEnv()

const MUSIC_DIR = path.resolve(
  process.argv[2] || process.env.MUSIC_DIR || '/var/www/audio'
)
const CONCURRENCY = 3
const TIMEOUT_MS = 15000
const POLITE_DELAY_MS = 200
const MAX_ATTEMPTS = 4

const SOURCE_KEY = 'imgurl'
const OUTPUT_DIR = 'images'
const OUTPUT_BASENAME = 'original'

const OUTPUT_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg']

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const exists = async filePath => {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

const extFromContentType = contentType => {
  if (!contentType) return '.jpg'
  if (contentType.includes('image/webp')) return '.webp'
  if (contentType.includes('image/avif')) return '.avif'
  if (contentType.includes('image/png')) return '.png'
  if (contentType.includes('image/jpeg')) return '.jpg'
  if (contentType.includes('image/svg+xml')) return '.svg'
  return '.jpg'
}

const fetchWithTimeout = async (url, options = {}, timeoutMs = TIMEOUT_MS) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    })
  } finally {
    clearTimeout(timer)
  }
}

const alreadyHasOriginal = async imagesDir => {
  for (const extension of OUTPUT_EXTENSIONS) {
    if (await exists(path.join(imagesDir, `${OUTPUT_BASENAME}${extension}`))) {
      return true
    }
  }

  return false
}

const readMetadata = async metadataPath => {
  const metadataRaw = await fs.readFile(metadataPath, 'utf8')
  return JSON.parse(metadataRaw)
}

const downloadOriginal = async (songDir, songId) => {
  const metadataPath = path.join(songDir, 'metadata.json')
  if (!(await exists(metadataPath))) {
    return { songId, status: 'skip', reason: 'missing metadata.json' }
  }

  let metadata
  try {
    metadata = await readMetadata(metadataPath)
  } catch {
    return { songId, status: 'skip', reason: 'invalid metadata.json' }
  }

  const url = metadata?.[SOURCE_KEY]
  if (!url || typeof url !== 'string') {
    return { songId, status: 'skip', reason: 'no imgurl in metadata' }
  }

  const imagesDir = path.join(songDir, OUTPUT_DIR)
  await fs.mkdir(imagesDir, { recursive: true })

  if (await alreadyHasOriginal(imagesDir)) {
    return { songId, status: 'skip', reason: 'original already exists' }
  }

  let response

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'ViulumeriImageIngest/1.0'
      }
    })

    if (response.status === 429) {
      const retryAfterHeader = response.headers.get('retry-after')
      const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : 2
      const retryDelay = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
        ? retryAfterSeconds * 1000
        : 2000
      await sleep(retryDelay)
      continue
    }

    if (!response.ok) {
      if (attempt < MAX_ATTEMPTS) {
        await sleep(500 * attempt)
        continue
      }
      return { songId, status: 'error', reason: `http ${response.status}` }
    }

    break
  }

  if (!response) {
    return { songId, status: 'error', reason: 'no response' }
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.startsWith('image/')) {
    return {
      songId,
      status: 'error',
      reason: `not image content-type: ${contentType || 'unknown'}`
    }
  }

  const extension = extFromContentType(contentType)
  const targetPath = path.join(imagesDir, `${OUTPUT_BASENAME}${extension}`)

  const bytes = Buffer.from(await response.arrayBuffer())
  await fs.writeFile(targetPath, bytes)

  return { songId, status: 'ok', file: targetPath }
}

const run = async () => {
  console.log(`Using MUSIC_DIR: ${MUSIC_DIR}`)

  const entries = await fs.readdir(MUSIC_DIR, { withFileTypes: true })
  const songIds = entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)

  let index = 0
  const results = []

  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (index < songIds.length) {
      const i = index++
      const songId = songIds[i]
      const songDir = path.join(MUSIC_DIR, songId)

      const result = await downloadOriginal(songDir, songId)
      results.push(result)

      if (result.status === 'ok') {
        console.log(`OK   ${songId} -> ${result.file}`)
      } else if (result.status === 'skip') {
        console.log(`SKIP ${songId} (${result.reason})`)
      } else {
        console.log(`ERR  ${songId} (${result.reason})`)
      }

      await sleep(POLITE_DELAY_MS)
    }
  })

  await Promise.all(workers)

  const okCount = results.filter(r => r.status === 'ok').length
  const skipCount = results.filter(r => r.status === 'skip').length
  const errCount = results.filter(r => r.status === 'error').length

  console.log(`\nProcessed ${results.length} song folders in ${MUSIC_DIR}`)
  console.log(`Downloaded: ${okCount}, Skipped: ${skipCount}, Errors: ${errCount}`)

  if (errCount > 0) {
    process.exitCode = 1
  }
}

run().catch(error => {
  console.error('Failed to fetch original song images:', error)
  process.exit(1)
})
