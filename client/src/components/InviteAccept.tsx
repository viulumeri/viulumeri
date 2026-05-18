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
        <p className="flex justify-center">Kirjaudu sisään vastataksesi kutsuun</p>
        <Link
          className="button-basic block mx-auto"
          to={`/login?next=${encodeURIComponent(location.pathname)}`}
        >
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
          <div className="inline-flex gap-4 mt-4">
            <button 
            className="button-basic-small block mx-auto mt-4 hover:bg-grey-700 rounded-full px-6 py-2 text-xl font-semibold"
            onClick={() => accept.mutate(token!)}
            disabled={accept.isPending}
            >
            {accept.isPending ? 'Vaihdetaan…' : 'Vahvista'}
            </button>
            <button 
              className="button-basic-small block mx-auto mt-4 bg-red-600 hover:bg-red-700 text-white rounded-full px-6 py-2 text-xl font-semibold"
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
