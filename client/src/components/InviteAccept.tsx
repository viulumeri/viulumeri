import { useParams, useNavigate, Link } from 'react-router-dom'
import { useInviteDetails, useAcceptInvite } from '../hooks/useInvite'
import { useSession } from '../auth-client'
import { useLocation } from 'react-router-dom'

export const InviteAccept = () => {
  const location = useLocation()
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { data: session, isPending: sessionPending } = useSession()
  const { data, isPending: invitePending, isError } = useInviteDetails(token!)
  const accept = useAcceptInvite()

  if (sessionPending || invitePending) return <div>Ladataan…</div>

  if (!session) {
    return (
      <div>
        <p>Kirjaudu sisään vastataksesi kutsuun</p>
        <Link to={`/login?next=${encodeURIComponent(location.pathname)}`}>
          Kirjaudu
        </Link>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div>Linkki ei ole enää voimassa. Pyydä uusi linkki opettajalta.</div>
    )
  }

  return (
    <div>
      <h2>Liity opettajan {data.teacher.name} oppilaaksi</h2>
      <button
        onClick={async () => {
          await accept.mutateAsync(token!)
          console.log('Linked to teacher:', data.teacher.name)
          navigate('/')
        }}
        disabled={accept.isPending}
      >
        {accept.isPending ? 'Liitetään…' : 'Vahvista'}
      </button>
      {accept.isError && <p style={{ color: 'red' }}>Linkitys epäonnistui.</p>}
    </div>
  )
}
