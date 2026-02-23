import { usePracticeSessions } from '../../hooks/usePracticeSessions'
import { useUserData } from '../../hooks/useUserData'
import { calculateStreak } from '../../utils/streakCalculator'
import SessionCard from './SessionCard'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'

const SessionList = () => {
  const { sessions, loading, deletePracticeSession } = usePracticeSessions()
  const { updateUserData } = useUserData()

  const handleDelete = async (sessionId) => {
    const result = await deletePracticeSession(sessionId)
    if (result.error) {
      const message = result.error.message || result.error
      alert('Failed to delete session: ' + message)
      return
    }
    // result.sessions is the updated list after deletion
    const updatedSessions = result.sessions
    const total = updatedSessions.reduce((sum, s) => sum + s.duration, 0)
    const dates = updatedSessions.map(s => s.date)
    const streak = calculateStreak(dates)
    const lastDate = dates.length > 0 ? dates.sort((a, b) => b.localeCompare(a))[0] : null
    await updateUserData({
      totalPracticeTime: total,
      currentStreak: streak,
      lastPracticeDate: lastDate
    })
  }

  if (loading) {
    return <LoadingSpinner size="large" />
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border-2 border-cartoon-secondary/20">
        <p className="text-2xl text-gray-500">No practice sessions yet 🎵</p>
        <p className="text-gray-400 mt-2">Log your first session to start tracking!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sessions.map(session => (
        <SessionCard
          key={session.id}
          session={session}
          onDelete={() => handleDelete(session.id)}
        />
      ))}
    </div>
  )
}

export default SessionList
