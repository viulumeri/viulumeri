import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, List, ListOrdered, Link2 } from 'lucide-react'

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const TextEditor = ({ value, onChange, placeholder }: Props) => {
  const savedSelection = useRef<{ from: number; to: number } | null>(null)
  const isExternalUpdate = useRef(false)
  const [linkDialog, setLinkDialog] = useState<{ url: string; text: string } | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      if (isExternalUpdate.current) return
      onChange(editor.isEmpty ? '' : editor.getHTML())
    },
  })

  const state = useEditorState({
    editor,
    selector: ctx => ({
      isBold: ctx.editor?.isActive('bold') ?? false,
      isItalic: ctx.editor?.isActive('italic') ?? false,
      isBulletList: ctx.editor?.isActive('bulletList') ?? false,
      isOrderedList: ctx.editor?.isActive('orderedList') ?? false,
      isLink: ctx.editor?.isActive('link') ?? false,
      heading: ctx.editor?.isActive('heading', { level: 2 }) ? '2'
        : ctx.editor?.isActive('heading', { level: 3 }) ? '3' : '0',
    }),
  })

  // Sync external value changes without triggering onChange
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    if (editor.isFocused) return
    const current = editor.getHTML()
    if (current !== value) {
      isExternalUpdate.current = true
      editor.commands.setContent(value)
      isExternalUpdate.current = false
    }
  }, [value, editor])

  const handleLink = () => {
    if (!editor) return
    savedSelection.current = {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
    }
    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
    )
    const prev = editor.getAttributes('link').href ?? ''
    setLinkDialog({ url: prev, text: selectedText })
  }

  const submitLink = (rawUrl: string, text: string) => {
    setLinkDialog(null)
    if (!editor) return
    const url =
      rawUrl && !/^https?:\/\//i.test(rawUrl) ? `https://${rawUrl}` : rawUrl
    if (url !== '' && !/^https?:\/\//i.test(url)) return
    const sel = savedSelection.current
    if (url === '') {
      const chain = sel ? editor.chain().focus().setTextSelection(sel) : editor.chain().focus()
      chain.unsetLink().run()
      return
    }
    const hasSelection = sel && sel.from !== sel.to
    if (text) {
      // Insert/replace with custom display text + link
      const chain = sel ? editor.chain().focus().setTextSelection(sel) : editor.chain().focus()
      chain.insertContent({ type: 'text', text, marks: [{ type: 'link', attrs: { href: url } }] }).run()
    } else if (hasSelection) {
      // Apply link to existing selected text
      editor.chain().focus().setTextSelection(sel!).setLink({ href: url }).run()
    } else {
      // No selection and no display text: insert URL as link text (strip protocol for readability)
      const chain = sel ? editor.chain().focus().setTextSelection(sel) : editor.chain().focus()
      const displayText = url.replace(/^https?:\/\//i, '')
      chain.insertContent({ type: 'text', text: displayText, marks: [{ type: 'link', attrs: { href: url } }] }).run()
    }
  }

  const btn = (active: boolean) =>
    `p-1.5 rounded ${active ? 'bg-white/25 text-white' : 'hover:bg-white/15 text-gray-300'}`

  return (
    <div className="rounded-lg bg-white/20 overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-white/10">
        <select
          value={state.heading}
          onChange={e => {
            const val = e.target.value
            if (val === '2') editor?.chain().focus().setHeading({ level: 2 }).run()
            else if (val === '3') editor?.chain().focus().setHeading({ level: 3 }).run()
            else editor?.chain().focus().setParagraph().run()
          }}
          className="text-xs rounded bg-neutral-700 text-gray-100 px-1.5 py-1 outline-none hover:bg-neutral-600 cursor-pointer [color-scheme:dark]"
        >
          <option value="0">Normaali</option>
          <option value="2">Otsikko</option>
          <option value="3">Väliotsikko</option>
        </select>
        <span className="w-px self-stretch bg-white/10 mx-0.5" />
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={btn(state.isBold)}
          title="Lihavointi"
          aria-label="Lihavointi"
          aria-pressed={state.isBold}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={btn(state.isItalic)}
          title="Kursivointi"
          aria-label="Kursivointi"
          aria-pressed={state.isItalic}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={btn(state.isBulletList)}
          title="Lista"
          aria-label="Lista"
          aria-pressed={state.isBulletList}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={btn(state.isOrderedList)}
          title="Numeroitu lista"
          aria-label="Numeroitu lista"
          aria-pressed={state.isOrderedList}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleLink}
          className={btn(state.isLink)}
          title="Linkki"
          aria-label="Linkki"
          aria-pressed={state.isLink}
        >
          <Link2 className="w-4 h-4" />
        </button>
      </div>
      <EditorContent
          editor={editor}
          className="p-3 text-gray-300 min-h-[120px] max-h-[300px] overflow-y-auto
            [&_.tiptap]:outline-none [&_.tiptap]:min-h-[96px]
            [&_.tiptap_p]:my-1
            [&_.tiptap_h2]:text-xl [&_.tiptap_h2]:font-bold [&_.tiptap_h2]:mt-3 [&_.tiptap_h2]:mb-1 [&_.tiptap_h2]:text-gray-100
            [&_.tiptap_h3]:text-lg [&_.tiptap_h3]:font-semibold [&_.tiptap_h3]:mt-2 [&_.tiptap_h3]:mb-1 [&_.tiptap_h3]:text-gray-200
            [&_.tiptap_strong]:font-semibold
            [&_.tiptap_em]:italic
            [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ul]:my-1
            [&_.tiptap_ul_ul]:list-[circle]
            [&_.tiptap_ul_ul_ul]:list-[square]
            [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_ol]:my-1
            [&_.tiptap_ol_ol]:list-[lower-alpha]
            [&_.tiptap_ol_ol_ol]:list-[lower-roman]
            [&_.tiptap_li]:my-0.5
            [&_.tiptap_a]:text-blue-400 [&_.tiptap_a]:underline
            [&_.tiptap_p.is-empty:first-child::before]:content-[attr(data-placeholder)]
            [&_.tiptap_p.is-empty:first-child::before]:float-left
            [&_.tiptap_p.is-empty:first-child::before]:text-gray-500
            [&_.tiptap_p.is-empty:first-child::before]:pointer-events-none
            [&_.tiptap_p.is-empty:first-child::before]:h-0"
        />
      {linkDialog !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onMouseDown={() => setLinkDialog(null)}
        >
          <div
            className="bg-neutral-800 rounded-lg p-4 w-80 shadow-xl"
            onMouseDown={e => e.stopPropagation()}
          >
            <h3 className="text-white text-sm font-medium mb-3">Lisää linkki</h3>
            <label htmlFor="link-text" className="block text-xs text-gray-400 mb-1">Näyttötapa</label>
            <input
              id="link-text"
              type="text"
              className="w-full rounded bg-white/10 text-gray-200 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-white/30 mb-3"
              placeholder="Linkin teksti"
              value={linkDialog.text}
              onChange={e => setLinkDialog({ ...linkDialog, text: e.target.value })}
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') submitLink(linkDialog.url, linkDialog.text)
                if (e.key === 'Escape') setLinkDialog(null)
              }}
            />
            <label htmlFor="link-url" className="block text-xs text-gray-400 mb-1">Verkko-osoite (URL)</label>
            <input
              id="link-url"
              type="url"
              className="w-full rounded bg-white/10 text-gray-200 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-white/30 mb-3"
              placeholder=""
              value={linkDialog.url}
              onChange={e => setLinkDialog({ ...linkDialog, url: e.target.value })}
              onKeyDown={e => {
                if (e.key === 'Enter') submitLink(linkDialog.url, linkDialog.text)
                if (e.key === 'Escape') setLinkDialog(null)
              }}
            />
            <div className="flex items-center gap-2">
              {state.isLink && (
                <button
                  type="button"
                  onClick={() => submitLink('', '')}
                  className="text-xs text-red-400 hover:text-red-300 mr-auto"
                >
                  Poista linkki
                </button>
              )}
              <button
                type="button"
                onClick={() => setLinkDialog(null)}
                className="px-3 py-1 text-xs rounded bg-white/10 text-gray-300 hover:bg-white/20"
              >
                Peruuta
              </button>
              <button
                type="button"
                onClick={() => submitLink(linkDialog.url, linkDialog.text)}
                className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-500"
              >
                Tallenna
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TextEditor
