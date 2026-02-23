import { useUserData } from '../../hooks/useUserData'
import { usePracticeSessions } from '../../hooks/usePracticeSessions'
import StreakDisplay from './StreakDisplay'
import GoalProgress from './GoalProgress'
import SessionCard from '../practice/SessionCard'
import { getTodayString, getWeekRange, getMonthKey } from '../../utils/dateHelpers'
import Card from '../ui/Card'
import { Link } from 'react-router-dom'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'

const Dashboard = () => {
  const { userData, loading: userLoading } = useUserData()
  const { sessions, loading: sessionsLoading } = usePracticeSessions()

  const loading = userLoading || sessionsLoading

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (!userData) {
    return <ErrorMessage message="User data not found" />
  }

  // Compute progress
  const today = getTodayString()
  const dailyCurrent = sessions
    .filter(s => s.date === today)
    .reduce((sum, s) => sum + s.duration, 0)

  const { start: weekStart, end: weekEnd } = getWeekRange()
  const weeklyCurrent = sessions
    .filter(s => s.date >= weekStart && s.date <= weekEnd)
    .reduce((sum, s) => sum + s.duration, 0)

  const monthKey = getMonthKey()
  const monthlyCurrent = sessions
    .filter(s => s.date.startsWith(monthKey))
    .reduce((sum, s) => sum + s.duration, 0)

  const dailyGoal = userData.dailyGoal || 0
  const weeklyGoal = userData.weeklyGoal || 0
  const monthlyGoal = userData.monthlyGoal || 0

  // Recent sessions (last 5)
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-cartoon-primary">
          Welcome back, {userData.displayName || 'Musician'}! 🎉
        </h1>
        <p className="text-lg text-gray-600 mt-2">Keep practicing to maintain your streak!</p>
      </div>

      {/* Streak and Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 flex justify-center">
          <StreakDisplay streak={userData.currentStreak || 0} />
        </div>
        <div className="lg:col-span-2">
          <GoalProgress
            dailyGoal={dailyGoal}
            dailyCurrent={dailyCurrent}
            weeklyGoal={weeklyGoal}
            weeklyCurrent={weeklyCurrent}
            monthlyGoal={monthlyGoal}
            monthlyCurrent={monthlyCurrent}
          />
        </div>
      </div>

      {/* Recent Sessions */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-cartoon-secondary">Recent Sessions 🎵</h2>
          <Link to="/practice" className="text-cartoon-primary font-semibold hover:underline">
            View All →
          </Link>
        </div>
        {recentSessions.length > 0 ? (
          <div className="space-y-3">
            {recentSessions.map(session => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No practice sessions yet. Start logging!</p>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/practice" className="card flex items-center justify-center space-x-2 hover:shadow-cartoon-lg transition-shadow">
          <span className="text-3xl">✏️</span>
          <span className="font-bold text-cartoon-primary">Log Practice</span>
        </Link>
        <Link to="/calendar" className="card flex items-center justify-center space-x-2 hover:shadow-cartoon-lg transition-shadow">
          <span className="text-3xl">📅</span>
          <span className="font-bold text-cartoon-primary">Calendar</span>
        </Link>
        <Link to="/profile" className="card flex items-center justify-center space-x-2 hover:shadow-cartoon-lg transition-shadow">
          <span className="text-3xl">👤</span>
          <span className="font-bold text-cartoon-primary">Profile</span>
        </Link>
        <button
          onClick={() => window.location.reload()}
          className="card flex items-center justify-center space-x-2 hover:shadow-cartoon-lg transition-shadow"
        >
          <span className="text-3xl">🔄</span>
          <span className="font-bold text-cartoon-primary">Refresh</span>
        </button>
      </div>
    </div>
  )
}

export default Dashboard
