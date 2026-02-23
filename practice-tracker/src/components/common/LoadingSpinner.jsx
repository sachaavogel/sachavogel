const LoadingSpinner = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-6 h-6 border-3',
    medium: 'w-12 h-12 border-4',
    large: 'w-20 h-20 border-4'
  }

  return (
    <div className={`${sizeClasses[size]} border-cartoon-accent/30 border-t-cartoon-primary rounded-full animate-spin`} />
  )
}

export default LoadingSpinner
