import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from './AuthContext'

const UserDataContext = createContext({})

export const useUserData = () => useContext(UserDataContext)

export const UserDataProvider = ({ children }) => {
  const { user } = useAuth()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchUserData = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        setUserData(userDoc.data())
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchUserData()
    } else {
      setUserData(null)
    }
  }, [user, fetchUserData])

  const updateUserData = async (updates) => {
    if (!user) return { error: 'No user logged in' }

    try {
      await updateDoc(doc(db, 'users', user.uid), updates)
      setUserData(prev => ({ ...prev, ...updates }))
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const refreshUserData = async () => {
    await fetchUserData()
  }

  return (
    <UserDataContext.Provider value={{
      userData,
      loading,
      updateUserData,
      refreshUserData,
      fetchUserData
    }}>
      {children}
    </UserDataContext.Provider>
  )
}
