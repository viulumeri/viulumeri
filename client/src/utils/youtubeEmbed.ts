export const extractYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
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
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}`
    iframe.allowFullscreen = true
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture')

    anchor.replaceWith(iframe)
  })

  return doc.body.innerHTML
}
