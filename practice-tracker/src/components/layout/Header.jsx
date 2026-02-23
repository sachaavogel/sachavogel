import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { motion } from 'framer-motion'

const Header = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { path: '/', label: 'Dashboard' },
    { path: '/practice', label: 'Practice' },
    { path: '/calendar', label: 'Calendar' },
    { path: '/profile', label: 'Profile' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <header className="bg-white shadow-cartoon sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <motion.div
              whileHover={{ rotate: 15 }}
              className="text-4xl"
            >
              🎵
            </motion.div>
            <span className="text-2xl font-bold text-cartoon-primary">
              Practice<span className="text-cartoon-secondary">Tracker</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  isActive(link.path)
                    ? 'bg-cartoon-primary text-white shadow-cartoon-primary'
                    : 'text-cartoon-text hover:bg-cartoon-bg'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <button onClick={logout} className="btn btn-outline">
                Logout
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-xl bg-cartoon-bg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden pb-4 space-y-2"
          >
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-xl font-semibold transition-all ${
                  isActive(link.path)
                    ? 'bg-cartoon-primary text-white'
                    : 'text-cartoon-text hover:bg-cartoon-bg'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <button
                onClick={() => {
                  logout()
                  setMobileMenuOpen(false)
                }}
                className="w-full text-left px-4 py-2 rounded-xl font-semibold text-cartoon-primary hover:bg-cartoon-bg"
              >
                Logout
              </button>
            )}
          </motion.nav>
        )}
      </div>
    </header>
  )
}

export default Header
