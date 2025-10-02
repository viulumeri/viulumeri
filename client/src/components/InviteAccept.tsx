import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { useInviteDetails, useAcceptInvite } from '../hooks/useInvite'
import { useSession } from '../auth-client'

export const InviteAccept = () => {
  const location = useLocation()
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { data: session, isPending: sessionPending } = useSession()
  const { data, isPending: invitePending, isError } = useInviteDetails(token!, !!session)

  const accept = useAcceptInvite({
    onSuccess: () => {
      navigate('/')
    },
    onError: error => console.error('Accept invite failed:', error)
  })

  if (sessionPending) return <div>Ladataan…</div>

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

  if (invitePending) return <div>Ladataan…</div>

  if (!token) return <div>Virheellinen kutsulinkki.</div>

  if (isError || !data || !data.teacher) {
    return (
      <div>Linkki ei ole enää voimassa. Pyydä uusi linkki opettajalta.</div>
    )
  }

  const { teacher, currentTeacher } = data

  return (
    <div>
      {currentTeacher ? (
        <>
          <h2>Nykyinen opettajasi on {currentTeacher.name}.</h2>
          <p>Haluatko vaihtaa opettajaksi {teacher.name}?</p>
          <button
            onClick={() => accept.mutate(token!)}
            disabled={accept.isPending}
          >
            {accept.isPending ? 'Vaihdetaan…' : 'Vahvista'}
          </button>
          <button onClick={() => navigate('/')}>Peruuta</button>
          {accept.isError && (
            <p style={{ color: 'red' }}>Linkitys epäonnistui.</p>
          )}
        </>
      ) : (
        <>
          <h2>Liity opettajan {data.teacher.name} oppilaaksi</h2>
          <button
            onClick={() => accept.mutate(token!)}
            disabled={accept.isPending}
          >
            {accept.isPending ? 'Liitetään…' : 'Vahvista'}
          </button>
          {accept.isError && (
            <p style={{ color: 'red' }}>Linkitys epäonnistui.</p>
          )}
        </>
      )}
    </div>
  )
}
