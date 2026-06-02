export const renderWithLinks = (text: string) => {
  const parts = text.split(/(\S+@\S+\.\S+|https?:\/\/\S+)/g)

  return parts.map((part, index) => {
    if (/^\S+@\S+\.\S+$/.test(part)) {
      return (
        <a
          key={index}
          href={`mailto:${part}`}
          className="text-blue-400 font-semibold hover:underline"
        >
          {part}
        </a>
      )
    }

    if (/^https?:\/\/\S+$/.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="text-blue-400 font-semibold hover:underline"
        >
          {part}
        </a>
      )
    }

    return part
  })
}