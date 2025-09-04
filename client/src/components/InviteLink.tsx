import { useState } from 'react'
import { useSession } from '../auth-client'
import { useGenerateInviteLink } from '../hooks/useInvite'

export const InviteLink = () => {
  const { data: session, isPending } = useSession()
  const [url, setUrl] = useState('')

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
        <p>
          Linkki: <input readOnly value={url} />
        </p>
      )}
      {gen.isError && <div style={{ color: 'red' }}>Virhe</div>}
    </div>
  )
}
