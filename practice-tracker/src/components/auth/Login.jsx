import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { login, resetPassword } from '../../firebase/auth'
import { motion } from 'framer-motion'
import LoadingSpinner from '../common/LoadingSpinner'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

const Login = () => {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Forgot password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMessage, setForgotMessage] = useState('')

  const handleForgotPassword = async () => {
    if (!forgotEmail) return
    setForgotLoading(true)
    setForgotMessage('')
    const result = await resetPassword(forgotEmail)
    setForgotLoading(false)
    if (result.error) {
      setForgotMessage(result.error.message || 'Failed to send reset email')
    } else {
      setForgotMessage('Password reset email sent! Check your inbox.')
      setForgotEmail('')
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')

    const result = await login(data.email, data.password)

    if (result.error) {
      setError(result.error.message || 'Failed to login')
    } else {
      navigate('/')
    }

    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[80vh] flex items-center justify-center"
    >
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cartoon-primary mb-2">
            Welcome Back! 🎵
          </h1>
          <p className="text-gray-600">Sign in to continue your musical journey</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-100 border-2 border-red-400 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-cartoon-text mb-2">
              Email
            </label>
            <input
              type="email"
              {...register('email')}
              className="input w-full"
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-cartoon-text mb-2">
              Password
            </label>
            <input
              type="password"
              {...register('password')}
              className="input w-full"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-cartoon-primary hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full flex items-center justify-center space-x-2"
          >
            {loading ? (
              <LoadingSpinner size="small" />
            ) : (
              <>
                <span>Sign In</span>
                <span>🎵</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-cartoon-primary font-semibold hover:underline">
              Sign up here!
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        title="Reset Password"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          <Input
            label="Email"
            type="email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            placeholder="your@email.com"
          />
          {forgotMessage && (
            <p className={`text-sm ${forgotMessage.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
              {forgotMessage}
            </p>
          )}
          <Button
            onClick={handleForgotPassword}
            disabled={forgotLoading || !forgotEmail}
            variant="primary"
            className="w-full"
          >
            {forgotLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </div>
      </Modal>
    </motion.div>
  )
}

export default Login
