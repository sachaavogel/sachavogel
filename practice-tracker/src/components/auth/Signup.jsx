import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signup } from '../../firebase/auth'
import { motion } from 'framer-motion'
import LoadingSpinner from '../common/LoadingSpinner'

const signupSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

const Signup = () => {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(signupSchema)
  })

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')

    const { confirmPassword, ...signupData } = data
    const result = await signup(signupData.email, signupData.password, signupData.displayName)

    if (result.error) {
      setError(result.error.message || 'Failed to create account')
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
          <h1 className="text-4xl font-bold text-cartoon-secondary mb-2">
            Join the Band! 🎸
          </h1>
          <p className="text-gray-600">Create your account and start tracking</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-100 border-2 border-red-400 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-cartoon-text mb-2">
              Display Name
            </label>
            <input
              type="text"
              {...register('displayName')}
              className="input w-full"
              placeholder="Your Name"
            />
            {errors.displayName && (
              <p className="mt-1 text-sm text-red-500">{errors.displayName.message}</p>
            )}
          </div>

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

          <div>
            <label className="block text-sm font-semibold text-cartoon-text mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              {...register('confirmPassword')}
              className="input w-full"
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-secondary w-full flex items-center justify-center space-x-2"
          >
            {loading ? (
              <LoadingSpinner size="small" />
            ) : (
              <>
                <span>Create Account</span>
                <span>🎉</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-cartoon-secondary font-semibold hover:underline">
              Sign in!
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default Signup
