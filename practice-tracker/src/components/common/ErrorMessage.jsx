const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="p-6 bg-red-50 border-2 border-red-300 rounded-3xl text-center">
      <div className="text-5xl mb-4">😿</div>
      <h3 className="text-xl font-bold text-red-700 mb-2">Oops!</h3>
      <p className="text-red-600 mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-primary">
          Try Again
        </button>
      )}
    </div>
  )
}

export default ErrorMessage
