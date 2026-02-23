import { motion } from 'framer-motion'
import { formatDate, formatDuration } from '../../utils/dateHelpers'

const SessionCard = ({ session, onDelete }) => {
  const handleDelete = () => {
    if (window.confirm('Delete this practice session?')) {
      onDelete()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-2xl border-2 border-cartoon-secondary/20 p-4 mb-3 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎵</span>
          <div>
            <p className="font-bold text-cartoon-primary text-lg">{session.instrument}</p>
            <p className="text-sm text-gray-500">{formatDate(session.date)}</p>
          </div>
        </div>
        {session.notes && (
          <p className="mt-2 text-gray-600 text-sm italic">{session.notes}</p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-2xl font-bold text-cartoon-secondary">{formatDuration(session.duration)}</p>
        </div>
        {onDelete && (
          <button
            onClick={handleDelete}
            className="text-red-400 hover:text-red-600 p-2 text-2xl leading-none"
            title="Delete"
          >
            🗑️
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default SessionCard
