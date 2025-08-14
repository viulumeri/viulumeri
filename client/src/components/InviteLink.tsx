import { useState } from 'react'
import { useSession } from '../auth-client'
import { useGenerateInviteLink } from '../hooks/useInvite'

export const InviteLink = () => {
  const { data: session } = useSession()
  const gen = useGenerateInviteLink()
  const [url, setUrl] = useState('')

  if (!session) return <div>Kirjaudu</div>

  return (
    <div>
      <h3>Lisää uusi oppilas</h3>
      <button
        onClick={async () => {
          const r = await gen.mutateAsync()
          setUrl(r.inviteUrl)
        }}
      >
        {gen.isPending ? 'Luodaan…' : 'Luo kutsulinkki'}
      </button>
      {url && (
        <p>
          Linkki: <input readOnly value={url} />
        </p>
      )}
      {gen.isError && <div style={{ color: 'red' }}>Virhe</div>}
    </div>
  )
}
