import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserData } from '../../hooks/useUserData'
import InstrumentSelector from './InstrumentSelector'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'

const EditProfile = () => {
  const { userData, updateUserData } = useUserData()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    displayName: '',
    instruments: [],
    dailyGoal: 0,
    weeklyGoal: 0,
    monthlyGoal: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (userData) {
      setFormData({
        displayName: userData.displayName || '',
        instruments: userData.instruments || [],
        dailyGoal: userData.dailyGoal || 0,
        weeklyGoal: userData.weeklyGoal || 0,
        monthlyGoal: userData.monthlyGoal || 0
      })
    }
  }, [userData])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const result = await updateUserData(formData)
    setLoading(false)
    if (result.error) {
      setError(result.error.message || 'Failed to update profile')
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/profile'), 1500)
    }
  }

  const handleChange = (field) => (e) => {
    const value = field === 'dailyGoal' || field === 'weeklyGoal' || field === 'monthlyGoal'
      ? parseInt(e.target.value) || 0
      : e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold text-cartoon-primary mb-8 text-center">Edit Profile ✏️</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-100 border-2 border-red-400 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-100 border-2 border-green-400 rounded-xl text-green-700 text-sm">
              Profile updated successfully! Redirecting...
            </div>
          )}

          <Input
            label="Display Name"
            value={formData.displayName}
            onChange={handleChange('displayName')}
            placeholder="Your name"
            required
          />

          <InstrumentSelector
            instruments={formData.instruments}
            onChange={(instruments) => setFormData(prev => ({ ...prev, instruments }))}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-cartoon-text mb-2">
                Daily Goal (min)
              </label>
              <input
                type="number"
                min="0"
                value={formData.dailyGoal}
                onChange={handleChange('dailyGoal')}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-cartoon-text mb-2">
                Weekly Goal (min)
              </label>
              <input
                type="number"
                min="0"
                value={formData.weeklyGoal}
                onChange={handleChange('weeklyGoal')}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-cartoon-text mb-2">
                Monthly Goal (min)
              </label>
              <input
                type="number"
                min="0"
                value={formData.monthlyGoal}
                onChange={handleChange('monthlyGoal')}
                className="input w-full"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate('/profile')} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading} disabled={loading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default EditProfile
