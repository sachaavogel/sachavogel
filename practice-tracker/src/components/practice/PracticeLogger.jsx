import { useState } from 'react'
import { useUserData } from '../../hooks/useUserData'
import { usePracticeSessions } from '../../hooks/usePracticeSessions'
import { useNavigate } from 'react-router-dom'
import { calculateStreak } from '../../utils/streakCalculator'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { getTodayString } from '../../utils/dateHelpers'
import confetti from 'canvas-confetti'

const PracticeLogger = () => {
  const { userData } = useUserData()
  const { addPracticeSession } = usePracticeSessions()
  const { updateUserData } = useUserData()
  const navigate = useNavigate()
  const [date, setDate] = useState(getTodayString())
  const [duration, setDuration] = useState('')
  const [instrument, setInstrument] = useState(userData?.instruments?.[0] || '')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const resetForm = () => {
    setDate(getTodayString())
    setDuration('')
    setInstrument(userData?.instruments?.[0] || '')
    setNotes('')
    setSuccess(false)
  }

  const fireConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const durationNum = parseInt(duration)
    if (isNaN(durationNum) || durationNum <= 0) {
      setError('Please enter a valid duration (minutes)')
      setLoading(false)
      return
    }

    if (!instrument) {
      setError('Please select an instrument')
      setLoading(false)
      return
    }

    const sessionData = {
      date,
      duration: durationNum,
      instrument,
      notes: notes.trim() || ''
    }

    const result = await addPracticeSession(sessionData)
    if (result.error) {
      setError(result.error.message || 'Failed to log practice')
      setLoading(false)
      return
    }

    // Update userData aggregates
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

    setLoading(false)
    setSuccess(true)
    fireConfetti()
    setTimeout(() => {
      resetForm()
    }, 1000)
  }

  if (!userData || userData.instruments?.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <h3 className="text-2xl font-bold text-cartoon-primary mb-4">Add Instruments First! 🎸</h3>
          <p className="text-gray-600 mb-6">You need to add at least one instrument before logging practice.</p>
          <Button onClick={() => navigate('/profile/edit')} variant="primary">
            Go to Profile
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-cartoon-secondary mb-6">Log Practice Session ✏️</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-100 border-2 border-red-400 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-100 border-2 border-green-400 rounded-xl text-green-700 text-sm">
            Practice logged successfully! 🎉
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-cartoon-text mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-cartoon-text mb-2">Duration (minutes)</label>
            <input
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="input w-full"
              placeholder="30"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-cartoon-text mb-2">Instrument</label>
            <select
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
              className="input w-full"
              required
            >
              <option value="">Select an instrument</option>
              {userData.instruments?.map(inst => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-cartoon-text mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input w-full h-24 resize-none"
              placeholder="What did you practice?"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          loading={loading}
          variant="primary"
          className="w-full"
        >
          {loading ? 'Logging...' : 'Log Practice 🎵'}
        </Button>
      </form>
    </div>
  )
}

export default PracticeLogger
