import { useParams, useNavigate, useLocation } from 'react-router-dom'
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
    <div className="space-y-4">
      <h2 className="flex justify-center">Kirjaudu sisään vastaanottaaksesi kutsuun</h2>
      <button
        className="button-basic block mx-auto mt-1"
        onClick={() => navigate(`/login?next=${encodeURIComponent(location.pathname)}`)}
      >
        Kirjaudu sisään
      </button>
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
          <div className="inline-flex gap-6 mt-4">
            <button 
            className="button-basic block mx-auto "
            onClick={() => accept.mutate(token!)}
            disabled={accept.isPending}
            >
            {accept.isPending ? 'Vaihdetaan…' : 'Vahvista'}
            </button>
            <button 
              className="button-basic block mx-auto "
              onClick={() => navigate('/')}>
              Peruuta
            </button>

          </div>
          {accept.isError && (
            <p style={{ color: 'red' }}>Linkitys epäonnistui.</p>
          )}
        </>
      ) : (
        <>
          <h2 className="inline-flex gap-1">Kutsu oppilaaksi</h2>
          <h3 className="inline-flex gap-1 mt-1">Opettaja: <strong>{data.teacher.name}</strong></h3>
          <button
            className="button-basic block mx-auto mt-3 "
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
