import { useSession } from '../auth-client'
import { Header } from './Header'
import { useNavigate } from 'react-router-dom'

export const StudentStartPage = () => {
  const { data: session, isPending } = useSession()
  const navigate = useNavigate()

  if (isPending) return <div>Ladataan...</div>
  if (!session?.user?.name) return <div>Kirjaudu sisään</div>

  return (
    <div className="flex flex-col h-screen">
      <Header center={<h1 className="">Hei {session.user.name}</h1>} />
      <main className="flex-1 flex items-center justify-center px-6">
        <button
          onClick={() => navigate('/student/homework/list')}
          className="bg-white text-black rounded-full px-6 py-3 text-lg shadow-md hover:bg-gray-100"
        >
          Aloita
        </button>
      </main>
    </div>
  )
}
