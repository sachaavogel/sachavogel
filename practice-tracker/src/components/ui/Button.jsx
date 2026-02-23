import { motion } from 'framer-motion'

const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'font-bold border-2 transition-all flex items-center justify-center rounded-2xl shadow-cartoon active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'

  const variantClasses = {
    primary: 'bg-cartoon-primary text-white hover:border-cartoon-accent hover:shadow-cartoon-primary',
    secondary: 'bg-cartoon-secondary text-white hover:border-cartoon-primary hover:shadow-cartoon-secondary',
    outline: 'bg-white text-cartoon-primary border-cartoon-primary hover:bg-cartoon-primary hover:text-white hover:shadow-cartoon-primary',
    success: 'bg-cartoon-success text-white hover:border-cartoon-accent hover:shadow-cartoon-accent'
  }

  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg'
  }

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        children
      )}
    </motion.button>
  )
}

export default Button
