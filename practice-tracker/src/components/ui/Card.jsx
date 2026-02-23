import { motion } from 'framer-motion'

const Card = ({
  children,
  className = '',
  hoverable = false,
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={hoverable ? { scale: 1.02 } : {}}
      className={`bg-cartoon-card rounded-3xl border-2 border-cartoon-secondary/20 p-6 shadow-cartoon ${hoverable ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}

export default Card
