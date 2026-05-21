import { useEffect, useState } from 'react'

interface SummaryResponse {
  teacherCount: number
  studentCount: number
  homeworkCount: number
}

export const AdminPanel = () => {
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/summary', { credentials: 'include' })
      .then(async response => {
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || 'Failed to load admin summary')
        }
        return response.json() as Promise<SummaryResponse>
      })
      .then(setSummary)
      .catch(err => {
        setError(err.message)
      })
  }, [])

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      <p>Tämä on superkäyttäjän hallintapaneelin kanta. Tässä voidaan myöhemmin näyttää järjestelmän tilanne ja hallintatoiminnot.</p>

      {error && <div className="error">{error}</div>}

      {summary ? (
        <div className="admin-summary">
          <div>Opettajia: {summary.teacherCount}</div>
          <div>Oppilaita: {summary.studentCount}</div>
          <div>Tehtäviä: {summary.homeworkCount}</div>
        </div>
      ) : (
        !error && <div>Ladataan yhteenvedon tietoja...</div>
      )}
    </div>
  )
}
