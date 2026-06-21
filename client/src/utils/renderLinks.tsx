export const renderWithLinks = (text: string) => {
  const parts = text.split(/(\S+@\S+\.\S+|https?:\/\/\S+)/g)
  
  return parts.flatMap((part, index) => {
    if (/^\S+@\S+\.\S+$/.test(part)) {
      return (
        <a key={index} href={`mailto:${part}`} className="text-blue-400 font-semibold hover:underline">
          {part}
        </a>
      )
    }
    if (/^https?:\/\/\S+$/.test(part)) {
      return (
        <a key={index} href={part} target="_blank" rel="noreferrer" className="text-blue-400 font-semibold hover:underline">
          {part}
        </a>
      )
    }
    // Split plain text on newlines and insert <br />
    return part.split('\n').flatMap((line, i, arr) =>
      i < arr.length - 1 ? [line, <br key={`${index}-${i}`} />] : [line]
    )
  })
}