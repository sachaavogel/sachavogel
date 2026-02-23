import { motion } from 'framer-motion'
import PracticeLogger from './PracticeLogger'
import SessionList from './SessionList'

const Practice = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <h1 className="text-4xl font-bold text-cartoon-primary text-center">Practice Sessions 🎸</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <PracticeLogger />
        </div>
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-cartoon-secondary mb-4">Session History</h2>
          <SessionList />
        </div>
      </div>
    </motion.div>
  )
}

export default Practice
