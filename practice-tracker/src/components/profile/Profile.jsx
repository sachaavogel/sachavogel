import { useUserData } from '../../hooks/useUserData'
import { usePracticeSessions } from '../../hooks/usePracticeSessions'
import { calculateLongestStreak } from '../../utils/streakCalculator'
import { formatDuration, formatDate } from '../../utils/dateHelpers'
import Card from '../ui/Card'
import Button from '../ui/Button'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'
import { Link, useNavigate } from 'react-router-dom'

const Profile = () => {
  const { userData, loading: userLoading } = useUserData()
  const { sessions, loading: sessionsLoading } = usePracticeSessions()
  const navigate = useNavigate()

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

  const totalSessions = sessions.length
  const totalTime = userData.totalPracticeTime || 0
  const avgSessionLength = totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0
  const longestStreak = calculateLongestStreak(sessions.map(s => s.date))

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-cartoon-primary text-center">My Profile 🎸</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Basic Info */}
        <Card>
          <h2 className="text-2xl font-bold text-cartoon-secondary mb-4">Basic Info</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Display Name</p>
              <p className="text-xl font-semibold">{userData.displayName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-xl font-semibold">{userData.email}</p>
            </div>
          </div>
          <div className="mt-6">
            <Button onClick={() => navigate('/profile/edit')} variant="primary" className="w-full">
              Edit Profile ✏️
            </Button>
          </div>
        </Card>

        {/* Instruments */}
        <Card>
          <h2 className="text-2xl font-bold text-cartoon-secondary mb-4">Instruments 🎹</h2>
          {userData.instruments && userData.instruments.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {userData.instruments.map(inst => (
                <span key={inst} className="px-4 py-2 bg-cartoon-accent text-cartoon-text rounded-full font-semibold">
                  {inst}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No instruments added yet. Add some to start tracking!</p>
          )}
        </Card>

        {/* Goals */}
        <Card>
          <h2 className="text-2xl font-bold text-cartoon-secondary mb-4">Practice Goals 🎯</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Daily Goal</p>
              <p className="text-2xl font-bold text-cartoon-primary">{userData.dailyGoal} minutes</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Weekly Goal</p>
              <p className="text-2xl font-bold text-cartoon-primary">{userData.weeklyGoal || 'Not set'} minutes</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Monthly Goal</p>
              <p className="text-2xl font-bold text-cartoon-primary">{userData.monthlyGoal || 'Not set'} minutes</p>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <Card>
          <h2 className="text-2xl font-bold text-cartoon-secondary mb-4">Statistics 📊</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Total Practice Time</p>
              <p className="text-2xl font-bold text-cartoon-primary">{formatDuration(totalTime)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Streak</p>
              <p className="text-2xl font-bold text-cartoon-primary">{userData.currentStreak} days 🔥</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Longest Streak</p>
              <p className="text-2xl font-bold text-cartoon-primary">{longestStreak} days</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Average Session</p>
              <p className="text-2xl font-bold text-cartoon-primary">{formatDuration(avgSessionLength)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Sessions</p>
              <p className="text-2xl font-bold text-cartoon-primary">{totalSessions}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Practice</p>
              <p className="text-lg font-semibold text-cartoon-text">
                {userData.lastPracticeDate ? formatDate(userData.lastPracticeDate) : 'Never'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Profile
