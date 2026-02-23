import { useState, useMemo } from 'react'
import { usePracticeSessions } from '../../hooks/usePracticeSessions'
import { formatDuration, getMonthKey } from '../../utils/dateHelpers'
import Card from '../ui/Card'

const Calendar = () => {
  const { sessions, loading } = usePracticeSessions()
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const monthKey = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }, [currentMonth])

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }, [currentMonth])

  const firstDayOfWeek = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    return new Date(year, month, 1).getDay()
  }, [currentMonth])

  // Map sessions by date for quick lookup
  const sessionsByDate = useMemo(() => {
    const map = {}
    sessions.forEach(session => {
      if (session.date.startsWith(monthKey)) {
        if (!map[session.date]) {
          map[session.date] = { total: 0, count: 0 }
        }
        map[session.date].total += session.duration
        map[session.date].count += 1
      }
    })
    return map
  }, [sessions, monthKey])

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      newMonth.setMonth(newMonth.getMonth() - 1)
      return newMonth
    })
  }

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      newMonth.setMonth(newMonth.getMonth() + 1)
      return newMonth
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-6xl animate-bounce">🎵</div>
      </div>
    )
  }

  return (
    <Card>
      <div className="mb-4 flex justify-between items-center">
        <button onClick={goToPreviousMonth} className="p-2 rounded-xl bg-cartoon-bg hover:bg-cartoon-accent/30 text-2xl">
          ‹
        </button>
        <h2 className="text-2xl font-bold text-cartoon-primary">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <button onClick={goToNextMonth} className="p-2 rounded-xl bg-cartoon-bg hover:bg-cartoon-accent/30 text-2xl">
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dayLabels.map(day => (
          <div key={day} className="text-center font-bold text-cartoon-secondary text-sm">
            {day}
          </div>
        ))}

        {/* Empty cells for days before the first day of month */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="h-24"></div>
        ))}

        {/* Days of the month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const year = currentMonth.getFullYear()
          const month = String(currentMonth.getMonth() + 1).padStart(2, '0')
          const dayStr = String(day).padStart(2, '0')
          const dateStr = `${year}-${month}-${dayStr}`
          const daySessions = sessionsByDate[dateStr]
          const hasPractice = !!daySessions

          const isToday = dateStr === new Date().toISOString().split('T')[0]

          return (
            <div
              key={day}
              className={`h-24 border-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                isToday ? 'border-cartoon-primary bg-cartoon-accent/20' : 'border-cartoon-secondary/20 bg-white'
              }`}
            >
              <span className={`font-bold ${isToday ? 'text-cartoon-primary' : ''}`}>{day}</span>
              {hasPractice && (
                <div className="mt-2 text-xs font-semibold bg-cartoon-success text-white px-2 py-1 rounded-full">
                  {formatDuration(daySessions.total)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export default Calendar
