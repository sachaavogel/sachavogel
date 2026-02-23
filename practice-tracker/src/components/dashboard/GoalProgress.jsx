import { motion } from 'framer-motion'
import Card from '../ui/Card'

const GoalProgress = ({ dailyGoal, dailyCurrent, weeklyGoal, weeklyCurrent, monthlyGoal, monthlyCurrent }) => {
  const goals = [
    { label: 'Daily', goal: dailyGoal, current: dailyCurrent, color: 'bg-cartoon-primary' },
    { label: 'Weekly', goal: weeklyGoal, current: weeklyCurrent, color: 'bg-cartoon-secondary' },
    { label: 'Monthly', goal: monthlyGoal, current: monthlyCurrent, color: 'bg-cartoon-accent' }
  ]

  return (
    <Card>
      <h2 className="text-2xl font-bold text-cartoon-secondary mb-6">Progress Goals 🎯</h2>
      <div className="space-y-6">
        {goals.map(({ label, goal, current, color }) => {
          const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0
          return (
            <div key={label}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-cartoon-text">{label}</span>
                <span className="text-sm font-bold text-cartoon-primary">
                  {current} / {goal} min
                </span>
              </div>
              <div className="progress-bar">
                <motion.div
                  className={`progress-bar-fill ${color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export default GoalProgress
