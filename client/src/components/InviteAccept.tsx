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
       <div className="flex flex-col items-center text-center space-y-4">
         <h2 className="text-xl">Kirjaudu sisään vastaanottaaksesi kutsun.</h2>
         <button
           className="button-basic"
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
    <div className="flex flex-col items-center text-center space-y-4">
      {currentTeacher ? (
        <>
          <h2 className="text-xl">Nykyinen opettajasi on {currentTeacher.name}.</h2>
          <p>Haluatko vaihtaa opettajaksi {teacher.name}?</p>
          <div className="flex gap-6">
            <button
              className="button-basic"
              onClick={() => accept.mutate(token!)}
              disabled={accept.isPending}
            >
              {accept.isPending ? 'Vaihdetaan…' : 'Vahvista'}
            </button>
            <button
              className="button-basic"
              onClick={() => navigate('/')}
            >
              Peruuta
            </button>
          </div>
          {accept.isError && (
            <p style={{ color: 'red' }}>Linkitys epäonnistui.</p>
          )}
        </>
      ) : (
        <>
          <h2 className="text-xl">Kutsu oppilaaksi</h2>
          <p>Opettaja: <strong>{data.teacher.name}</strong></p>
          <button
            className="button-basic"
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
