import { useState } from 'react'
import { useSession } from '../auth-client'
import { useGenerateInviteLink } from '../hooks/useInvite'
import { QRCodeSVG } from 'qrcode.react'

// qr code component from: https://www.npmjs.com/package/qrcode.react

export const InviteLink = () => {
  const { data: session, isPending } = useSession()
  const [url, setUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const gen = useGenerateInviteLink({
    onSuccess: data => {
      setUrl(data.inviteUrl)
    },
    onError: error => console.error('Generate invite failed:', error)
  })

  if (isPending) return <div>Ladataan...</div>
  if (!session) return <div>Kirjaudu</div>

  return (
    <div className="space-y-6 p-6 pb-24">
      <h2 className="text-xl font-semibold">Lisää uusi oppilas</h2>

      <div className="flex justify-center">
        <button
          onClick={() => gen.mutate()}
          disabled={gen.isPending}
          className="button-basic disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {gen.isPending ? 'Luodaan…' : 'Luo kutsulinkki'}
        </button>
      </div>

      {url && (
        <div className="bg-neutral-900 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Kutsulinkki:
            </label>
            <input
              readOnly
              value={url}
              className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2 text-gray-100 text-sm"
            />
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => {
                navigator.clipboard.writeText(url)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              disabled={copied}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                copied
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {copied ? 'Kopioitu' : 'Kopioi linkki'}
            </button>
          </div>

          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG value={url} size={320} />
            </div>
          </div>
        </div>
      )}

      {gen.isError && (
        <div className="text-red-400 text-center">
          Virhe kutsulinkin luomisessa
        </div>
      )}
    </div>
  )
}
