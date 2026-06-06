export const extractYouTubeVideoId = (url: string): string | null => {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  const host = parsed.hostname.replace(/^www\./, '')
  const path = parsed.pathname

  if (host === 'youtube.com') {
    if (path === '/watch') {
      const v = parsed.searchParams.get('v')
      return v && /^[a-zA-Z0-9_-]{11}$/.test(v) ? v : null
    }
    if (path.startsWith('/shorts/') || path.startsWith('/embed/')) {
      const id = path.split('/')[2]
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null
    }
  }

  if (host === 'youtu.be') {
    const id = path.slice(1)
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null
  }

  return null
}

export const processYouTubeEmbeds = (html: string): string => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  doc.querySelectorAll('a[href]').forEach((el) => {
    const anchor = el as HTMLAnchorElement
    const videoId = extractYouTubeVideoId(anchor.href)
    if (!videoId) return

    const iframe = doc.createElement('iframe')
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1`
    iframe.title = anchor.textContent?.trim() || 'YouTube video'
    iframe.loading = 'lazy'
    iframe.allowFullscreen = true
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture')

    anchor.replaceWith(iframe)
  })

  return doc.body.innerHTML
}
