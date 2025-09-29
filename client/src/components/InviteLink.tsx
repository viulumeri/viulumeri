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
    <div>
      <h3>Lisää uusi oppilas</h3>
      <button onClick={() => gen.mutate()} disabled={gen.isPending}>
        {gen.isPending ? 'Luodaan…' : 'Luo kutsulinkki'}
      </button>
      {url && (
        <div style={{ marginTop: '1rem' }}>
          <label style={{ display: 'block' }}>Linkki:</label>
          <input
            readOnly
            value={url}
            style={{ width: '100%', padding: '8px', fontSize: '0.9rem' }}
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(url)
              setCopied(true)
            }}
            disabled={copied}
            style={{
              padding: '6px 12px',
              backgroundColor: copied ? '#b0b0b0' : '#ffffff',
              color: copied ? '#333333' : '#000000',
              borderRadius: '4px'
            }}
          >
            {copied ? 'Kopioitu' : 'Kopioi linkki'}
          </button>
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <div style={{
              display: 'inline-block',
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '4px'
            }}>
              <QRCodeSVG value={url} size={128} />
            </div>
          </div>
        </div>
      )}
      {gen.isError && <div style={{ color: 'red' }}>Virhe</div>}
    </div>
  )
}
