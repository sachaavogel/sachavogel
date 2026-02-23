import { motion } from 'framer-motion'

const StreakDisplay = ({ streak }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-orange-100 to-red-100 rounded-3xl shadow-cartoon">
      <motion.div
        animate={{ scale: streak > 0 ? [1, 1.1, 1] : 1 }}
        transition={{ repeat: streak > 0 ? Infinity : 0, duration: 2 }}
        className="text-8xl mb-4"
      >
        🔥
      </motion.div>
      <motion.p
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="text-6xl font-black text-cartoon-primary"
      >
        {streak}
      </motion.p>
      <p className="text-2xl font-semibold text-gray-600 mt-2">day streak</p>
      {streak === 0 && (
        <p className="text-lg text-gray-500 mt-4">Start practicing today to build a streak!</p>
      )}
    </div>
  )
}

export default StreakDisplay
